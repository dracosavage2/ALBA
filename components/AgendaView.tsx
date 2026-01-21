
import React, { useState } from 'react';
import { Task } from '../types';
import { formatLocalDate } from '../App';

interface AgendaViewProps {
  tasks: Task[];
  onAdd: (task: Omit<Task, 'id'>) => void;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}

const AgendaView: React.FC<AgendaViewProps> = ({ tasks, onAdd, onToggle, onDelete }) => {
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(new Date().toLocaleDateString('en-CA')); // YYYY-MM-DD local
  const [time, setTime] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !date) return;
    onAdd({ 
      title, 
      dueDate: date, 
      dueTime: time || "08:00", // Default para 8h se vazio
      completed: false, 
      category: 'Geral' 
    });
    setTitle('');
    setTime('');
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex flex-col space-y-4">
          <input 
            type="text" 
            placeholder="O que precisa ser feito?"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500"
            required
          />
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Data</label>
              <input 
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="bg-slate-50 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 font-bold text-slate-700"
                required
              />
            </div>
            <div className="flex flex-col space-y-1">
              <label className="text-[10px] font-bold text-indigo-600 uppercase ml-1">Hora (Alerta)</label>
              <input 
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="bg-indigo-50 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 font-black text-indigo-700"
                required
              />
            </div>
          </div>
          <button 
            type="submit"
            className="w-full px-6 py-4 bg-indigo-600 text-white font-bold rounded-xl text-sm shadow-md hover:bg-indigo-700 active:scale-95 transition-all"
          >
            Adicionar à Agenda
          </button>
        </div>
      </form>

      <div className="space-y-3">
        {tasks
          .sort((a,b) => {
            if (a.dueDate !== b.dueDate) return a.dueDate.localeCompare(b.dueDate);
            return (a.dueTime || '00:00').localeCompare(b.dueTime || '00:00');
          })
          .map(task => (
          <div key={task.id} className="group flex items-center space-x-4 p-4 bg-white rounded-2xl shadow-sm border border-slate-100 transition-all">
            <button 
              onClick={() => onToggle(task.id)}
              className={`w-7 h-7 rounded-full border-2 flex items-center justify-center transition-colors ${task.completed ? 'bg-indigo-600 border-indigo-600' : 'border-slate-300'}`}
            >
              {task.completed && <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"/></svg>}
            </button>
            <div className="flex-1">
              <p className={`text-sm font-bold ${task.completed ? 'text-slate-400 line-through' : 'text-slate-800'}`}>
                {task.title}
              </p>
              <div className="flex items-center space-x-2 mt-1.5">
                <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-bold">
                  {formatLocalDate(task.dueDate)}
                </span>
                <span className={`flex items-center space-x-1.5 text-[11px] px-2.5 py-1 rounded-full font-black ring-1 ${task.dueTime ? 'bg-indigo-100 text-indigo-700 ring-indigo-200' : 'bg-slate-100 text-slate-400 ring-slate-200'}`}>
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                    <span>{task.dueTime || 'Sem hora'}</span>
                </span>
              </div>
            </div>
            <button 
              onClick={() => onDelete(task.id)}
              className="p-2 text-rose-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
            </button>
          </div>
        ))}
        {tasks.length === 0 && (
           <div className="text-center py-10 opacity-40">
              <p className="text-sm">Nenhum compromisso agendado.</p>
           </div>
        )}
      </div>
    </div>
  );
};

export default AgendaView;
