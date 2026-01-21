
import React from 'react';
import { ViewMode } from '../types';

interface HeaderProps {
  view: ViewMode;
  isMicActive?: boolean;
}

const Header: React.FC<HeaderProps> = ({ view, isMicActive }) => {
  const getTitle = () => {
    switch(view) {
      case 'dashboard': return 'Resumo do Dia';
      case 'agenda': return 'Minha Agenda';
      case 'finances': return 'Financeiro';
      default: return 'VozAgenda';
    }
  };

  // Obtém a data atual formatada: "15 de Outubro de 2023"
  const getCurrentDate = () => {
    const now = new Date();
    return now.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200 px-6 py-4 flex items-center justify-between">
      <div className="flex flex-col">
        <div className="flex items-center space-x-3">
          <h1 className="text-xl font-bold text-slate-800">{getTitle()}</h1>
          {isMicActive && (
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
            </span>
          )}
        </div>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">
          {getCurrentDate()}
        </p>
      </div>
      
      <div className="flex items-center space-x-3">
        <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center border border-indigo-200">
          <span className="text-indigo-600 font-black text-xs italic">A</span>
        </div>
      </div>
    </header>
  );
};

export default Header;
