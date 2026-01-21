
import React, { useState, useEffect } from 'react';
import { FocusSession } from '../types';

interface FocusModeProps {
  session: FocusSession;
  onEnd: (completed?: boolean) => void;
}

const FocusMode: React.FC<FocusModeProps> = ({ session, onEnd }) => {
  const [secondsLeft, setSecondsLeft] = useState(session.durationMinutes * 60);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (isPaused) return;
    if (secondsLeft <= 0) {
      onEnd(true);
      return;
    }

    const timer = setInterval(() => {
      setSecondsLeft(prev => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [secondsLeft, isPaused, onEnd]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = ((session.durationMinutes * 60 - secondsLeft) / (session.durationMinutes * 60)) * 100;

  return (
    <div className="fixed inset-0 z-[100] bg-slate-900 flex flex-col items-center justify-center p-8 overflow-hidden">
      {/* Background Decorativo */}
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-indigo-500 rounded-full blur-[100px] animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-500 rounded-full blur-[120px] animate-pulse delay-700"></div>
      </div>

      <div className="relative z-10 w-full max-w-md flex flex-col items-center">
        <div className="text-emerald-400 text-xs font-bold uppercase tracking-[0.4em] mb-4">Modo Foco Ativo</div>
        <h2 className="text-white text-3xl font-bold text-center mb-12 drop-shadow-lg">
          {session.taskTitle}
        </h2>

        {/* Círculo do Cronômetro */}
        <div className="relative w-64 h-64 flex items-center justify-center mb-12">
          <svg className="absolute inset-0 w-full h-full -rotate-90">
            <circle 
              cx="128" cy="128" r="120" 
              fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" 
            />
            <circle 
              cx="128" cy="128" r="120" 
              fill="none" stroke="#4f46e5" strokeWidth="8" 
              strokeDasharray="753.98" 
              strokeDashoffset={753.98 - (753.98 * progress) / 100}
              strokeLinecap="round"
              className="transition-all duration-1000"
            />
          </svg>
          <div className="text-white text-6xl font-black font-mono tracking-tighter">
            {formatTime(secondsLeft)}
          </div>
        </div>

        <div className="w-full space-y-4">
          <button 
            onClick={() => setIsPaused(!isPaused)}
            className={`w-full py-4 rounded-2xl font-bold transition-all border ${
              isPaused 
              ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400' 
              : 'bg-white/5 border-white/10 text-white hover:bg-white/10'
            }`}
          >
            {isPaused ? 'Continuar' : 'Pausar'}
          </button>
          
          <button 
            onClick={() => onEnd(false)}
            className="w-full py-4 rounded-2xl font-bold bg-rose-500/10 border border-rose-500/20 text-rose-500 hover:bg-rose-500/20 transition-all"
          >
            Encerrar Sessão
          </button>
        </div>

        <p className="mt-12 text-slate-500 text-sm italic font-medium">
          "O foco é a chave para a produtividade."
        </p>
      </div>
    </div>
  );
};

export default FocusMode;
