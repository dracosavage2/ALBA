
export interface Task {
  id: string;
  title: string;
  dueDate: string;
  dueTime?: string;
  completed: boolean;
  category: string;
}

export interface Transaction {
  id: string;
  description: string;
  amount: number;
  date: string;
  type: 'income' | 'expense';
  category: string;
}

export type ViewMode = 'dashboard' | 'agenda' | 'finances';

export type ThemeColor = 'indigo' | 'emerald' | 'rose' | 'amber' | 'violet' | 'slate';

export interface FocusSession {
  isActive: boolean;
  taskId?: string;
  taskTitle?: string;
  durationMinutes: number;
}

export interface AppState {
  tasks: Task[];
  transactions: Transaction[];
}
