
import React, { useEffect, useRef } from 'react';
import { Task } from '../types';

interface AlarmOverlayProps {
  alerts: Task[];
  onDismiss: (id: string) => void;
  onComplete: (id: string) => void;
}

const AlarmOverlay: React.FC<AlarmOverlayProps> = ({ alerts, onDismiss, onComplete }) => {
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    // Vibração intermitente e persistente
    const vibrationInterval = setInterval(() => {
      if ("vibrate" in navigator) {
        navigator.vibrate([400, 200, 400]);
      }
    }, 1000);

    // Som de alerta persistente (Oscilador)
    const playAlarmSound = () => {
      try {
        if (!audioContextRef.current) {
          audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
        const ctx = audioContextRef.current;
        if (ctx.state === 'suspended') ctx.resume();

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.type = 'square'; // Som mais agressivo de alarme
        osc.frequency.setValueAtTime(880, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.5);

        gain.gain.setValueAtTime(0, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.1, ctx.currentTime + 0.1);
        gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.5);

        osc.start();
        osc.stop(ctx.currentTime + 0.5);
      } catch (e) { console.error("Alarm Sound Error", e); }
    };
    
    // Toca a cada 800ms
    const soundInterval = setInterval(playAlarmSound, 800);
    
    return () => {
      clearInterval(vibrationInterval);
      clearInterval(soundInterval);
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  const currentAlert = alerts[0];

  if (!currentAlert) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
      <div className="absolute inset-0 bg-rose-600 animate-pulse opacity-90"></div>
      
      <div className="relative bg-white w-full max-w-sm rounded-3xl shadow-2xl p-8 flex flex-col items-center text-center animate-in zoom-in-95 duration-300">
        <div className="w-20 h-20 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mb-6 animate-bounce">
          <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        
        <h2 className="text-xs font-black text-rose-500 uppercase tracking-[0.3em] mb-2">ALERTA AGORA!</h2>
        <h3 className="text-2xl font-bold text-slate-800 mb-2 leading-tight">
          {currentAlert.title}
        </h3>
        <p className="text-slate-500 font-medium mb-8">
          Agendado para as {currentAlert.dueTime || '08:00'}
        </p>
        
        <div className="w-full space-y-3">
          <button 
            onClick={() => onComplete(currentAlert.id)}
            className="w-full py-4 bg-indigo-600 text-white font-bold rounded-2xl shadow-lg shadow-indigo-200 active:scale-95 transition-all"
          >
            Concluir Agora ✅
          </button>
          
          <button 
            onClick={() => onDismiss(currentAlert.id)}
            className="w-full py-4 bg-slate-100 text-slate-600 font-bold rounded-2xl active:scale-95 transition-all"
          >
            Ignorar ❌
          </button>
        </div>

        {alerts.length > 1 && (
          <p className="mt-6 text-[10px] font-bold text-rose-400 uppercase tracking-widest">
            Existem mais {alerts.length - 1} alertas pendentes
          </p>
        )}
      </div>
    </div>
  );
};

export default AlarmOverlay;
