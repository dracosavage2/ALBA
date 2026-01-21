
import React from 'react';
import { ViewMode } from '../types';

interface BottomNavProps {
  currentView: ViewMode;
  setView: (v: ViewMode) => void;
}

const BottomNav: React.FC<BottomNavProps> = ({ currentView, setView }) => {
  const NavItem = ({ view, label, icon }: { view: ViewMode, label: string, icon: React.ReactNode }) => {
    const isActive = currentView === view;
    return (
      <button 
        onClick={() => setView(view)}
        className={`flex flex-col items-center justify-center w-full py-3 transition-colors ${isActive ? 'text-indigo-600' : 'text-slate-400'}`}
      >
        {icon}
        <span className="text-[10px] mt-1 font-medium">{label}</span>
      </button>
    );
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 flex justify-around safe-bottom z-40 lg:w-64 lg:h-full lg:flex-col lg:border-r lg:border-t-0 lg:top-0">
      <div className="hidden lg:flex p-6 mb-8">
         <h2 className="text-2xl font-black text-indigo-600 italic">VozAgenda</h2>
      </div>
      
      <div className="flex flex-row w-full lg:flex-col lg:space-y-4">
        <NavItem 
          view="dashboard" 
          label="Início" 
          icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>} 
        />
        <NavItem 
          view="agenda" 
          label="Agenda" 
          icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>} 
        />
        <NavItem 
          view="finances" 
          label="Finanças" 
          icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>} 
        />
      </div>
      
      <div className="hidden lg:mt-auto lg:flex p-6 border-t border-slate-100">
        <p className="text-xs text-slate-400">© 2024 VozAgenda Pro</p>
      </div>
    </nav>
  );
};

export default BottomNav;
