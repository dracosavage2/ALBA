
import React from 'react';
import { Task, Transaction, ThemeColor } from '../types';
import { formatLocalDate } from '../App';

interface DashboardProps {
  tasks: Task[];
  transactions: Transaction[];
  onToggleTask: (id: string) => void;
  onDeleteTask?: (id: string) => void;
  onStartFocus: (taskId?: string, duration?: number) => void;
  theme: ThemeColor;
}

const Dashboard: React.FC<DashboardProps> = ({ tasks, transactions, onToggleTask, onDeleteTask, onStartFocus, theme }) => {
  const pendingTasks = tasks.filter(t => !t.completed).sort((a,b) => {
    if (a.dueDate !== b.dueDate) return a.dueDate.localeCompare(b.dueDate);
    return (a.dueTime || '23:59').localeCompare(b.dueTime || '23:59');
  });

  const nextTask = pendingTasks[0];

  const totalIncome = transactions.filter(tx => tx.type === 'income').reduce((acc, tx) => acc + tx.amount, 0);
  const totalExpense = transactions.filter(tx => tx.type === 'expense').reduce((acc, tx) => acc + tx.amount, 0);
  const balance = totalIncome - totalExpense;

  // Mapeia o gradiente baseado no tema
  const themeGradients: Record<ThemeColor, string> = {
    indigo: 'from-indigo-600 to-indigo-800',
    emerald: 'from-emerald-600 to-emerald-800',
    rose: 'from-rose-600 to-rose-800',
    amber: 'from-amber-600 to-amber-800',
    violet: 'from-violet-600 to-violet-800',
    slate: 'from-slate-700 to-slate-900',
  };

  return (
    <div className="space-y-6">
      {/* Próximo Compromisso em Destaque */}
      {nextTask && (
        <section className={`bg-gradient-to-br ${themeGradients[theme]} p-6 rounded-3xl shadow-xl text-white relative overflow-hidden`}>
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/10 rounded-full blur-2xl"></div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60 mb-2">Próximo Alarme</p>
          <h2 className="text-xl font-bold mb-1">{nextTask.title}</h2>
          <div className="flex items-center space-x-3 mt-4">
            <div className="bg-white/20 px-3 py-1.5 rounded-xl flex items-center space-x-2 backdrop-blur-md border border-white/10">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
              <span className="text-sm font-black">{nextTask.dueTime || '--:--'}</span>
            </div>
            <span className="text-xs font-medium text-white/80 italic">hoje, {formatLocalDate(nextTask.dueDate)}</span>
          </div>
        </section>
      )}

      {/* Resumo Financeiro */}
      <section className="grid grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
          <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Saldo Atual</p>
          <p className={`text-xl font-bold mt-1 ${balance >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
            R$ {balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
        </div>
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
          <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Pendências</p>
          <p className="text-xl font-bold mt-1 text-slate-800">{pendingTasks.length}</p>
        </div>
      </section>

      {/* Próximas Tarefas */}
      <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em]">Lista de Hoje</h3>
          <span className={`text-[10px] font-black text-${theme}-600 bg-${theme}-50 px-2 py-0.5 rounded-full uppercase`}>Tempo Real</span>
        </div>
        {pendingTasks.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm text-slate-400">Tudo limpo por aqui! 🎉</p>
          </div>
        ) : (
          <div className="space-y-3">
            {pendingTasks.slice(0, 5).map(task => (
              <div key={task.id} className="flex items-center space-x-3 p-4 bg-slate-50 rounded-2xl border border-transparent transition-all group">
                <input 
                  type="checkbox" 
                  checked={task.completed}
                  onChange={() => onToggleTask(task.id)}
                  className={`w-5 h-5 rounded-full border-slate-300 text-${theme}-600 focus:ring-${theme}-500 transition-all`} 
                />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-slate-800 line-clamp-1">{task.title}</p>
                  <div className="flex items-center space-x-2 mt-0.5">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">
                      {formatLocalDate(task.dueDate)}
                    </span>
                    {task.dueTime && (
                      <span className={`flex items-center space-x-1 text-[11px] bg-${theme}-600 text-white px-2 py-0.5 rounded-full font-black shadow-sm`}>
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                        <span>{task.dueTime}</span>
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-1">
                  <button onClick={() => onStartFocus(task.id, 25)} className={`bg-${theme}-100 text-${theme}-600 p-2 rounded-lg text-[10px] font-black hover:bg-${theme}-600 hover:text-white transition-all uppercase`}>FOCO</button>
                  {onDeleteTask && (
                    <button onClick={() => onDeleteTask(task.id)} className="p-2 text-rose-300 hover:text-rose-600 transition-colors">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default Dashboard;
