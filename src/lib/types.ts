
export type Transaction = {
  id: string;
  date: string;
  description: string;
  amount: number;
  deduction?: number;
  type: 'income' | 'expense';
  category: string; 
  tags?: string[];
  userId?: string;
  cardId?: string;
  invoiceMonth?: string;
};

export type Category = {
  id: string;
  name: string;
  type: 'income' | 'expense' | 'all';
  userId?: string;
};

export type Tag = {
  id: string;
  name: string;
  userId?: string;
}

export type Card = {
  id: string;
  cardName: string;
  last4: string;
  limit: number;
  dueDate: string;
  closingDate: string;
  userId?: string;
};

export type Invoice = {
  id: string;
  cardId: string;
  month: string;
  total: number;
  status: 'paid' | 'unpaid';
  userId?: string;
};

    