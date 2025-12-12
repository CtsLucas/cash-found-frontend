

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
  installments?: number;
  currentInstallment?: number;
  groupId?: string;
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
  limit: number;
  dueDate: number;
  last4: string;
  color?: string;
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

export type Installment = {
    id: string;
    transactionId: string;
    dueDate: string;
    amount: number;
    isPaid: boolean;
};

export type Locale = 'en' | 'pt-BR';
    
