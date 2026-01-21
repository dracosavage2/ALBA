
import React, { useState } from 'react';
import { Transaction } from '../types';

interface FinanceViewProps {
  transactions: Transaction[];
  onAdd: (tx: Omit<Transaction, 'id'>) => void;
  onDelete: (id: string) => void;
}

const FinanceView: React.FC<FinanceViewProps> = ({ transactions, onAdd, onDelete }) => {
  const [desc, setDesc] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [activeFilter, setActiveFilter] = useState<'income' | 'expense'>('expense');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!desc.trim() || !amount) return;
    onAdd({
      description: desc,
      amount: parseFloat(amount),
      date: new Date().toISOString(),
      type,
      category: 'Geral'
    });
    setDesc('');
    setAmount('');
    // Ao adicionar, muda o filtro para o tipo que acabou de ser adicionado para confirmação visual
    setActiveFilter(type);
  };

  const filteredTransactions = transactions.filter(tx => tx.type === activeFilter);

  return (
    <div className="space-y-6">
      {/* Menu Superior de Abas para Filtragem */}
      <div className="flex bg-white p-1.5 rounded-2xl shadow-sm border border-slate-100">
        <button 
          onClick={() => setActiveFilter('income')}
          className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all flex items-center justify-center space-x-2 ${
            activeFilter === 'income' 
            ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-200' 
            : 'text-slate-400 hover:text-emerald-600'
          }`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 11l5-5m0 0l5 5m-5-5v12"/>
          </svg>
          <span>Entradas</span>
        </button>
        <button 
          onClick={() => setActiveFilter('expense')}
          className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all flex items-center justify-center space-x-2 ${
            activeFilter === 'expense' 
            ? 'bg-rose-500 text-white shadow-lg shadow-rose-200' 
            : 'text-slate-400 hover:text-rose-600'
          }`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 13l-5 5m0 0l-5-5m5 5V6"/>
          </svg>
          <span>Saídas</span>
        </button>
      </div>

      {/* Formulário de Lançamento */}
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Novo Lançamento</h3>
        <div className="flex flex-col space-y-4">
          <div className="flex bg-slate-100 p-1 rounded-xl">
            <button 
              type="button" 
              onClick={() => setType('income')}
              className={`flex-1 py-2 text-[10px] font-bold rounded-lg transition-all ${type === 'income' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500'}`}
            >
              RECEITA
            </button>
            <button 
              type="button" 
              onClick={() => setType('expense')}
              className={`flex-1 py-2 text-[10px] font-bold rounded-lg transition-all ${type === 'expense' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-500'}`}
            >
              DESPESA
            </button>
          </div>
          <input 
            type="text" 
            placeholder="Descrição (ex: Salário, Aluguel...)"
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500"
          />
          <div className="flex space-x-3">
            <div className="relative flex-1">
              <span className="absolute left-4 top-3.5 text-slate-400 text-sm font-medium">R$</span>
              <input 
                type="number"
                placeholder="0,00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-slate-50 border-none rounded-xl pl-10 pr-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <button 
              type="submit"
              className="px-6 py-3 bg-indigo-600 text-white font-bold rounded-xl text-sm shadow-md hover:bg-indigo-700 active:scale-95 transition-all"
            >
              Lançar
            </button>
          </div>
        </div>
      </form>

      {/* Listagem Filtrada */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-2">
          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest">
            Histórico de {activeFilter === 'income' ? 'Entradas' : 'Saídas'}
          </h4>
          <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
            {filteredTransactions.length} itens
          </span>
        </div>
        
        {filteredTransactions.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-slate-200">
            <p className="text-sm text-slate-400">Nenhum registro encontrado nesta categoria.</p>
          </div>
        ) : (
          filteredTransactions
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .map(tx => (
            <div key={tx.id} className="flex items-center justify-between p-4 bg-white rounded-2xl shadow-sm border border-slate-100 animate-in fade-in slide-in-from-bottom-2">
              <div className="flex items-center space-x-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${tx.type === 'income' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                  {tx.type === 'income' ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 11l5-5m0 0l5 5m-5-5v12"/></svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 13l-5 5m0 0l-5-5m5 5V6"/></svg>
                  )}
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-800">{tx.description}</p>
                  <p className="text-[10px] text-slate-400 font-medium">
                    {new Date(tx.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' })}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <span className={`text-sm font-bold ${tx.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {tx.type === 'income' ? '+' : '-'} R$ {tx.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
                <button 
                  onClick={() => onDelete(tx.id)}
                  className="p-1 text-slate-300 hover:text-rose-500 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default FinanceView;
