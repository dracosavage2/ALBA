
import React, { useState } from 'react';
import { ViewMode, ThemeColor } from '../types';

interface HeaderProps {
  view: ViewMode;
  theme: ThemeColor;
  onThemeChange: (theme: ThemeColor) => void;
  isMicActive?: boolean;
}

const Header: React.FC<HeaderProps> = ({ view, theme, onThemeChange, isMicActive }) => {
  const [showThemeMenu, setShowThemeMenu] = useState(false);

  const themes: { name: ThemeColor, color: string }[] = [
    { name: 'indigo', color: 'bg-indigo-600' },
    { name: 'emerald', color: 'bg-emerald-600' },
    { name: 'rose', color: 'bg-rose-600' },
    { name: 'amber', color: 'bg-amber-600' },
    { name: 'violet', color: 'bg-violet-600' },
    { name: 'slate', color: 'bg-slate-800' },
  ];

  const getTitle = () => {
    switch(view) {
      case 'dashboard': return 'Resumo do Dia';
      case 'agenda': return 'Minha Agenda';
      case 'finances': return 'Financeiro';
      default: return 'VozAgenda';
    }
  };

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
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full bg-${theme}-400 opacity-75`}></span>
              <span className={`relative inline-flex rounded-full h-2 w-2 bg-${theme}-500`}></span>
            </span>
          )}
        </div>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">
          {getCurrentDate()}
        </p>
      </div>
      
      <div className="flex items-center space-x-2 relative">
        <button 
          onClick={() => setShowThemeMenu(!showThemeMenu)}
          className={`p-2 rounded-full transition-colors ${showThemeMenu ? `bg-${theme}-50 text-${theme}-600` : 'text-slate-400 hover:bg-slate-50'}`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" /></svg>
        </button>

        {showThemeMenu && (
          <div className="absolute top-12 right-0 bg-white border border-slate-200 shadow-2xl rounded-2xl p-4 w-48 animate-in fade-in zoom-in-95 duration-200">
            <p className="text-[10px] font-black uppercase text-slate-400 mb-3 tracking-widest">Escolha sua cor</p>
            <div className="grid grid-cols-3 gap-3">
              {themes.map(t => (
                <button 
                  key={t.name}
                  onClick={() => { onThemeChange(t.name); setShowThemeMenu(false); }}
                  className={`w-10 h-10 rounded-xl ${t.color} flex items-center justify-center transition-transform active:scale-90 ${theme === t.name ? 'ring-4 ring-offset-2 ring-slate-100 scale-110' : 'opacity-60 hover:opacity-100'}`}
                >
                  {theme === t.name && (
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className={`w-8 h-8 rounded-full bg-${theme}-100 flex items-center justify-center border border-${theme}-200`}>
          <span className={`text-${theme}-600 font-black text-xs italic`}>A</span>
        </div>
      </div>
    </header>
  );
};

export default Header;
