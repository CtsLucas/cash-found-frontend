export type Transaction = {
  id: string;
  date: string;
  description: string;
  amount: number;
  deduction?: number;
  type: 'income' | 'expense';
  category: string; // Changed to string to be more flexible
  tags?: string[];
};

export type Category = {
  id: string;
  name: string;
  type: 'income' | 'expense' | 'all';
};

export type Tag = {
  id: string;
  name: string;
}

export type Card = {
  id: string;
  cardName: string;
  last4: string;
  limit: number;
  dueDate: string;
  closingDate: string;
};

export type Invoice = {
  id: string;
  cardId: string;
  month: string;
  total: number;
  status: 'paid' | 'unpaid';
};
