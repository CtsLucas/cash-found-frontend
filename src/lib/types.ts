export type Transaction = {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  category: Category;
  status: 'pending' | 'completed' | 'failed';
};

export type Category = 'Groceries' | 'Utilities' | 'Rent' | 'Salary' | 'Freelance' | 'Entertainment' | 'Transport';

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
