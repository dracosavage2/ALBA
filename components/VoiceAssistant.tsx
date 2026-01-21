
import React, { useEffect, useRef, useState } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality, Type, FunctionDeclaration, Blob } from '@google/genai';
import { Task, Transaction, ViewMode } from '../types';

interface VoiceAssistantProps {
  onClose: () => void;
  tasks: Task[];
  onAddTask: (task: Omit<Task, 'id'>) => void;
  onDeleteTask: (id: string) => void;
  onAddTransaction: (tx: Omit<Transaction, 'id'>) => void;
  onNavigate: (view: ViewMode) => void;
  onStartFocus: (taskId?: string, duration?: number) => void;
}

const VoiceAssistant: React.FC<VoiceAssistantProps> = ({ onClose, tasks, onAddTask, onDeleteTask, onAddTransaction, onNavigate, onStartFocus }) => {
  const [status, setStatus] = useState<'connecting' | 'listening' | 'thinking' | 'speaking' | 'error' | 'closing'>('connecting');
  const [transcription, setTranscription] = useState('');
  
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const sessionRef = useRef<any>(null);
  const isComponentMounted = useRef(true);
  const isClosingRef = useRef(false);
  const isInitializingRef = useRef(false);
  
  const onAddTaskRef = useRef(onAddTask);
  const onDeleteTaskRef = useRef(onDeleteTask);
  const onAddTransactionRef = useRef(onAddTransaction);
  const onNavigateRef = useRef(onNavigate);
  const onStartFocusRef = useRef(onStartFocus);
  const onCloseRef = useRef(onClose);
  const tasksRef = useRef(tasks);

  useEffect(() => {
    onAddTaskRef.current = onAddTask;
    onDeleteTaskRef.current = onDeleteTask;
    onAddTransactionRef.current = onAddTransaction;
    onNavigateRef.current = onNavigate;
    onStartFocusRef.current = onStartFocus;
    onCloseRef.current = onClose;
    tasksRef.current = tasks;
  }, [onAddTask, onDeleteTask, onAddTransaction, onNavigate, onStartFocus, onClose, tasks]);

  const tools: FunctionDeclaration[] = [
    {
      name: 'add_task',
      description: 'Adiciona uma tarefa à agenda com data e hora.',
      parameters: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING, description: 'O título ou descrição da tarefa' },
          date: { type: Type.STRING, description: 'Data no formato YYYY-MM-DD' },
          time: { type: Type.STRING, description: 'Horário no formato HH:mm (Ex: 14:30, 08:00)' }
        },
        required: ['title', 'date']
      }
    },
    {
      name: 'delete_task',
      description: 'Apaga uma tarefa.',
      parameters: {
        type: Type.OBJECT,
        properties: {
          task_title: { type: Type.STRING, description: 'Título da tarefa para apagar' }
        },
        required: ['task_title']
      }
    },
    {
      name: 'add_transaction',
      description: 'Registra finanças.',
      parameters: {
        type: Type.OBJECT,
        properties: {
          description: { type: Type.STRING },
          amount: { type: Type.NUMBER },
          type: { type: Type.STRING, enum: ['income', 'expense'] }
        },
        required: ['description', 'amount', 'type']
      }
    },
    {
      name: 'close_assistant',
      description: 'Fecha o assistente.',
      parameters: { type: Type.OBJECT, properties: {} }
    }
  ];

  const decode = (base64: string) => {
    try {
      const binaryString = atob(base64);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
      return bytes;
    } catch (e) { return new Uint8Array(0); }
  };

  const createBlob = (data: Float32Array): Blob => {
    const int16 = new Int16Array(data.length);
    for (let i = 0; i < data.length; i++) {
      const s = Math.max(-1, Math.min(1, data[i] * 1.8));
      int16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
    }
    return {
      data: btoa(String.fromCharCode(...new Uint8Array(int16.buffer))),
      mimeType: 'audio/pcm;rate=16000',
    };
  };

  const cleanup = async () => {
    sourcesRef.current.forEach(s => { try { s.stop(); } catch(e){} });
    sourcesRef.current.clear();
    if (sessionRef.current) try { sessionRef.current.close(); } catch(e) {}
    if (processorRef.current) processorRef.current.disconnect();
    if (streamRef.current) streamRef.current.getTracks().forEach(track => track.stop());
    if (inputAudioContextRef.current) try { await inputAudioContextRef.current.close(); } catch(e) {}
    if (outputAudioContextRef.current) try { await outputAudioContextRef.current.close(); } catch(e) {}
    sessionRef.current = null;
  };

  const handleManualClose = async () => {
    if (isClosingRef.current) return;
    isClosingRef.current = true;
    setStatus('closing');
    await cleanup();
    onCloseRef.current();
  };

  const initSession = async () => {
    if (!isComponentMounted.current || isClosingRef.current || isInitializingRef.current) return;
    isInitializingRef.current = true;
    setStatus('connecting');
    try {
      await cleanup();
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      const outputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      inputAudioContextRef.current = inputCtx;
      outputAudioContextRef.current = outputCtx;
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        config: {
          responseModalities: [Modality.AUDIO],
          systemInstruction: 'Você é Alba. Sua missão é gerenciar tarefas e finanças. Importante: Ao adicionar tarefas, extraia sempre o horário mencionado. Se o usuário não disser a hora, use "08:00" como padrão. Responda de forma curta e prestativa.',
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } },
          tools: [{ functionDeclarations: tools }],
          inputAudioTranscription: {},
        },
        callbacks: {
          onopen: () => {
            if (!isComponentMounted.current || isClosingRef.current) return;
            setStatus('listening');
            isInitializingRef.current = false;
            const source = inputCtx.createMediaStreamSource(stream);
            const processor = inputCtx.createScriptProcessor(2048, 1, 1);
            processorRef.current = processor;
            processor.onaudioprocess = (e) => {
              if (isClosingRef.current) return;
              sessionPromise.then(session => {
                sessionRef.current = session;
                session.sendRealtimeInput({ media: createBlob(e.inputBuffer.getChannelData(0)) });
              });
            };
            source.connect(processor);
            processor.connect(inputCtx.destination);
          },
          onmessage: async (message: LiveServerMessage) => {
            if (isClosingRef.current) return;
            if (message.toolCall) {
              setStatus('thinking');
              for (const fc of message.toolCall.functionCalls) {
                let result = "ok";
                if (fc.name === 'add_task') {
                  const taskTime = (fc.args.time as string) || "08:00";
                  onAddTaskRef.current({ 
                    title: fc.args.title as string, 
                    dueDate: (fc.args.date as string), 
                    dueTime: taskTime,
                    completed: false, 
                    category: 'Voz' 
                  });
                  result = `Tarefa adicionada para as ${taskTime}`;
                } else if (fc.name === 'delete_task') {
                  const title = fc.args.task_title as string;
                  const task = tasksRef.current.find(t => t.title.toLowerCase().includes(title.toLowerCase()));
                  if (task) { onDeleteTaskRef.current(task.id); result = "Tarefa apagada"; }
                  else result = "Tarefa não encontrada";
                } else if (fc.name === 'add_transaction') {
                  onAddTransactionRef.current({ description: fc.args.description as string, amount: fc.args.amount as number, type: fc.args.type as any, date: new Date().toISOString(), category: 'Voz' });
                } else if (fc.name === 'close_assistant') {
                  handleManualClose();
                  return;
                }
                sessionPromise.then(s => s.sendToolResponse({ 
                  functionResponses: { id: fc.id, name: fc.name, response: { result } } 
                }));
              }
            }
            if (message.serverContent?.inputTranscription) setTranscription(message.serverContent.inputTranscription.text);
            const audioPart = message.serverContent?.modelTurn?.parts.find(p => p.inlineData);
            if (audioPart?.inlineData?.data) {
              setStatus('speaking');
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputCtx.currentTime);
              const dataInt16 = new Int16Array(decode(audioPart.inlineData.data).buffer);
              const buffer = outputCtx.createBuffer(1, dataInt16.length, 24000);
              buffer.getChannelData(0).set(Array.from(dataInt16).map(v => v / 32768.0));
              const source = outputCtx.createBufferSource();
              source.buffer = buffer;
              source.connect(outputCtx.destination);
              source.onended = () => {
                sourcesRef.current.delete(source);
                if (sourcesRef.current.size === 0) setStatus('listening');
              };
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += buffer.duration;
              sourcesRef.current.add(source);
            }
          },
          onerror: () => { setStatus('error'); isInitializingRef.current = false; },
          onclose: () => { if (isComponentMounted.current && !isClosingRef.current) { isInitializingRef.current = false; setTimeout(initSession, 2000); } }
        }
      });
    } catch (err) { setStatus('error'); isInitializingRef.current = false; }
  };

  useEffect(() => {
    initSession();
    return () => { isComponentMounted.current = false; cleanup(); };
  }, []);

  return (
    <div className="fixed inset-0 z-[150] flex flex-col items-center justify-center bg-slate-900/98 backdrop-blur-3xl p-6">
      <div className="w-full max-w-sm flex flex-col items-center">
        <div className="relative mb-20">
          <div className={`absolute -inset-24 rounded-full blur-[100px] transition-all duration-700 ${
              status === 'speaking' ? 'bg-indigo-500/50 scale-125' : 
              status === 'thinking' ? 'bg-amber-500/40 scale-110' : 
              status === 'listening' ? 'bg-emerald-500/30 scale-100' : 'bg-rose-500/30'
            }`}
          ></div>
          <div className={`w-40 h-40 rounded-full border-2 flex items-center justify-center relative z-10 transition-all duration-500 ${status === 'speaking' ? 'border-indigo-400 bg-indigo-500/10' : 'border-white/10'}`}>
            <div className="flex items-center justify-center space-x-1.5 h-16">
              {[...Array(5)].map((_, i) => (
                <div key={i} className={`w-1.5 rounded-full transition-all duration-75 ${status === 'speaking' ? 'bg-indigo-400 animate-bounce' : 'bg-white/20'}`} style={{ height: status === 'listening' ? `${8 + (i * 10)}px` : '8px', animationDelay: `${i * 0.1}s` }}></div>
              ))}
            </div>
          </div>
        </div>
        <h2 className="text-4xl font-black tracking-tighter italic mb-1 text-white uppercase">ALBA</h2>
        <div className="text-[9px] font-bold uppercase tracking-[0.5em] mb-12 text-slate-500">{status}</div>
        <div className="h-16 w-full text-center overflow-hidden mb-12">
           {transcription && <div className="text-white italic text-xs animate-in fade-in slide-in-from-bottom-2">"{transcription}"</div>}
        </div>
        <button onClick={handleManualClose} className="w-full py-5 rounded-2xl font-bold bg-white/5 hover:bg-rose-500/20 text-white border border-white/10 transition-colors uppercase text-xs tracking-widest">Encerrar Assistente</button>
      </div>
    </div>
  );
};

export default VoiceAssistant;
