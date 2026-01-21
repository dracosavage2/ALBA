
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ViewMode, Task, Transaction, FocusSession, ThemeColor } from './types';
import Dashboard from './components/Dashboard';
import AgendaView from './components/AgendaView';
import FinanceView from './components/FinanceView';
import BottomNav from './components/BottomNav';
import VoiceAssistant from './components/VoiceAssistant';
import Header from './components/Header';
import AlarmOverlay from './components/AlarmOverlay';
import FocusMode from './components/FocusMode';
import { GoogleGenAI, Modality } from "@google/genai";

export const formatLocalDate = (dateStr: string) => {
  if (!dateStr) return "";
  const [year, month, day] = dateStr.split('-');
  return `${day}/${month}/${year}`;
};

function decode(base64: string) {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
  return bytes;
}

async function decodeAudioData(data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

const App: React.FC = () => {
  const [view, setView] = useState<ViewMode>('dashboard');
  const [theme, setTheme] = useState<ThemeColor>('indigo');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [notifiedTasks, setNotifiedTasks] = useState<string[]>([]);
  const [activeAlerts, setActiveAlerts] = useState<Task[]>([]);
  const [isWakeWordListening, setIsWakeWordListening] = useState(false);
  const [focusSession, setFocusSession] = useState<FocusSession>({ isActive: false, durationMinutes: 25 });
  const [hasNotificationPermission, setHasNotificationPermission] = useState<boolean>(
    typeof Notification !== 'undefined' ? Notification.permission === 'granted' : false
  );
  
  const recognitionRef = useRef<any>(null);
  const isVoiceActiveRef = useRef(false);
  const wakeWordTimeoutRef = useRef<number | null>(null);
  const checkIntervalRef = useRef<number | null>(null);
  const notifiedTasksRef = useRef<string[]>([]);
  const tasksRef = useRef<Task[]>([]);

  useEffect(() => {
    isVoiceActiveRef.current = isVoiceActive;
    if (isVoiceActive) {
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); recognitionRef.current = null; } catch(e) {}
      }
    } else {
      startWakeWordService();
    }
  }, [isVoiceActive]);

  useEffect(() => {
    notifiedTasksRef.current = notifiedTasks;
  }, [notifiedTasks]);

  useEffect(() => {
    tasksRef.current = tasks;
  }, [tasks]);

  useEffect(() => {
    const savedTasks = localStorage.getItem('voz_tasks');
    const savedTx = localStorage.getItem('voz_tx');
    const savedNotified = localStorage.getItem('voz_notified');
    const savedTheme = localStorage.getItem('voz_theme') as ThemeColor;
    
    if (savedTasks) setTasks(JSON.parse(savedTasks));
    if (savedTx) setTransactions(JSON.parse(savedTx));
    if (savedTheme) setTheme(savedTheme);
    if (savedNotified) {
      const parsed = JSON.parse(savedNotified);
      setNotifiedTasks(parsed);
      notifiedTasksRef.current = parsed;
    }

    const syncChannel = new BroadcastChannel('alba-sync');
    syncChannel.onmessage = (event) => {
      if (event.data.type === 'TASK_ACTION') {
        const { action, taskId } = event.data;
        if (action === 'complete') toggleTask(taskId);
        else {
          setActiveAlerts(prev => prev.filter(t => t.id !== taskId));
          markAsNotified(taskId);
        }
      }
    };
    return () => syncChannel.close();
  }, []);

  useEffect(() => {
    localStorage.setItem('voz_tasks', JSON.stringify(tasks));
    localStorage.setItem('voz_tx', JSON.stringify(transactions));
    localStorage.setItem('voz_notified', JSON.stringify(notifiedTasks));
    localStorage.setItem('voz_theme', theme);
  }, [tasks, transactions, notifiedTasks, theme]);

  const requestPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      setHasNotificationPermission(permission === 'granted');
    }
  };

  const speakText = async (text: string) => {
    if (isVoiceActiveRef.current) return; 
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      if (audioCtx.state === 'suspended') await audioCtx.resume();
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } },
        },
      });
      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (base64Audio) {
        const audioBuffer = await decodeAudioData(decode(base64Audio), audioCtx, 24000, 1);
        const source = audioCtx.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(audioCtx.destination);
        source.start();
      }
    } catch (e) { console.error("TTS Error", e); }
  };

  const startWakeWordService = useCallback(() => {
    if (isVoiceActiveRef.current || focusSession.isActive) return;
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;
    if (recognitionRef.current) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'pt-BR';
    recognition.onstart = () => setIsWakeWordListening(true);
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript.toLowerCase();
      if (['alba', 'ei alba', 'oi alba', 'ajuda alba'].some(word => transcript.includes(word))) {
        setIsVoiceActive(true);
      }
    };
    recognition.onend = () => {
      setIsWakeWordListening(false);
      if (!isVoiceActiveRef.current && !focusSession.isActive) {
        wakeWordTimeoutRef.current = window.setTimeout(startWakeWordService, 500);
      }
    };
    try { recognition.start(); recognitionRef.current = recognition; } catch (e) {
      wakeWordTimeoutRef.current = window.setTimeout(startWakeWordService, 2000);
    }
  }, [focusSession.isActive]);

  const markAsNotified = (id: string) => {
    setNotifiedTasks(prev => {
      if (prev.includes(id)) return prev;
      const newList = [...prev, id];
      localStorage.setItem('voz_notified', JSON.stringify(newList));
      return newList;
    });
  };

  const addTask = (task: Task | Omit<Task, 'id'>, silent = false) => {
    const newTask = { ...task, id: ('id' in task) ? (task.id as string) : Math.random().toString(36).substring(2, 9) } as Task;
    setTasks(prev => [...prev, newTask]);
    if (!silent) speakText(`Tarefa salva: ${newTask.title}`);
  };

  const addTransaction = (tx: Omit<Transaction, 'id'>, silent = false) => {
    const newTx = { ...tx, id: Math.random().toString(36).substring(2, 9) };
    setTransactions(prev => [...prev, newTx]);
    if (!silent) speakText(`Lançamento de ${tx.amount} reais registrado.`);
  };

  useEffect(() => {
    const checkTasks = () => {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const todayLocal = `${year}-${month}-${day}`;
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const currentTimeStr = `${hours}:${minutes}`;

      tasksRef.current.forEach(task => {
        if (!task.completed && !notifiedTasksRef.current.includes(task.id)) {
          if (task.dueDate === todayLocal) {
            if (task.dueTime) {
              if (currentTimeStr >= task.dueTime) {
                console.log(`Alarm Triggered: ${task.title} at ${task.dueTime}`);
                triggerAlarm(task);
              }
            } else if (currentTimeStr >= "08:00") {
              triggerAlarm(task);
            }
          } else if (task.dueDate < todayLocal) {
            triggerAlarm(task);
          }
        }
      });
    };
    
    checkIntervalRef.current = window.setInterval(checkTasks, 5000);
    return () => { if (checkIntervalRef.current) clearInterval(checkIntervalRef.current); };
  }, []);

  const triggerAlarm = (task: Task) => {
    markAsNotified(task.id);
    
    if ('serviceWorker' in navigator && Notification.permission === 'granted') {
      navigator.serviceWorker.ready.then(registration => {
        const displayTime = task.dueTime ? ` [${task.dueTime}]` : '';
        registration.showNotification(`ALBA:${displayTime} ${task.title}`, {
          body: `Hora do seu compromisso agora!`,
          tag: 'alba-notif-' + task.id,
          vibrate: [500, 200, 500, 200, 500],
          requireInteraction: true,
          data: { taskId: task.id },
          actions: [
            { action: 'complete', title: 'Concluir ✅' },
            { action: 'dismiss', title: 'Ignorar' }
          ]
        } as any);
      });
    }
    
    if ("vibrate" in navigator) (navigator as any).vibrate([500, 200, 500]);
    speakText(`Atenção! Lembrete da Alba: ${task.title}`);
    setActiveAlerts(prev => prev.find(t => t.id === task.id) ? prev : [...prev, task]);
  };

  const toggleTask = (id: string) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
    setActiveAlerts(prev => prev.filter(t => t.id !== id));
    markAsNotified(id);
  };

  const deleteTask = (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
    setNotifiedTasks(prev => prev.filter(tid => tid !== id));
    setActiveAlerts(prev => prev.filter(t => t.id !== id));
  };

  return (
    <div className={`flex flex-col min-h-screen bg-slate-50 pb-24 lg:pb-0 lg:pl-64 ${focusSession.isActive ? 'overflow-hidden' : ''}`}>
      {!focusSession.isActive && (
        <>
          <Header view={view} theme={theme} onThemeChange={setTheme} isMicActive={isWakeWordListening} />
          
          {!hasNotificationPermission && (
            <div className="bg-amber-100 p-3 mx-4 mt-4 rounded-xl flex items-center justify-between border border-amber-200">
               <p className="text-[11px] font-bold text-amber-800">⚠️ Ative as notificações para receber alertas.</p>
               <button onClick={requestPermission} className="bg-amber-600 text-white px-3 py-1.5 rounded-lg text-[10px] font-black uppercase">Ativar</button>
            </div>
          )}

          <main className="flex-1 p-4 max-w-4xl mx-auto w-full">
            {view === 'dashboard' && <Dashboard theme={theme} tasks={tasks} transactions={transactions} onToggleTask={toggleTask} onDeleteTask={deleteTask} onStartFocus={(tid, dur) => setFocusSession({isActive: true, taskId: tid, durationMinutes: dur || 25})} />}
            {view === 'agenda' && <AgendaView theme={theme} tasks={tasks} onAdd={addTask} onToggle={toggleTask} onDelete={deleteTask} />}
            {view === 'finances' && <FinanceView theme={theme} transactions={transactions} onAdd={addTransaction} onDelete={(id) => setTransactions(prev => prev.filter(tx => tx.id !== id))} />}
          </main>
          <BottomNav theme={theme} currentView={view} setView={setView} />
        </>
      )}
      {focusSession.isActive && <FocusMode theme={theme} session={focusSession} onEnd={(comp) => {
        if (comp && focusSession.taskId) toggleTask(focusSession.taskId);
        setFocusSession({ isActive: false, durationMinutes: 25 });
        speakText("Foco encerrado.");
      }} />}
      {activeAlerts.length > 0 && !focusSession.isActive && <AlarmOverlay theme={theme} alerts={activeAlerts} onDismiss={(id) => { setActiveAlerts(prev => prev.filter(t => t.id !== id)); markAsNotified(id); }} onComplete={toggleTask} />}
      {!focusSession.isActive && (
        <div className="fixed bottom-24 right-4 z-50 lg:bottom-8 lg:right-8">
          <button onClick={() => setIsVoiceActive(true)} className={`w-16 h-16 rounded-full shadow-2xl flex items-center justify-center transition-all active:scale-90 relative ${isWakeWordListening ? `bg-${theme}-600` : 'bg-slate-400'}`}>
            {isWakeWordListening && <div className={`absolute inset-0 rounded-full bg-${theme}-400 animate-ping opacity-30`}></div>}
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white relative z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
          </button>
        </div>
      )}
      {isVoiceActive && <VoiceAssistant theme={theme} onClose={() => setIsVoiceActive(false)} tasks={tasks} onAddTask={(t) => addTask(t, true)} onDeleteTask={deleteTask} onAddTransaction={(tx) => addTransaction(tx, true)} onNavigate={setView} onStartFocus={(tid, dur) => setFocusSession({isActive: true, taskId: tid, durationMinutes: dur || 25})} />}
    </div>
  );
};

export default App;
