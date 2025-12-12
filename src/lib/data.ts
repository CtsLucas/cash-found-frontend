import { Transaction } from '@/lib/types';

export const transactions: Transaction[] = [
  { id: 'TXN001', date: '2024-07-15', description: "Trader Joe's", amount: 85.4, type: 'expense', category: 'Groceries' },
  { id: 'TXN002', date: '2024-07-15', description: 'Netflix Subscription', amount: 15.99, type: 'expense', category: 'Entertainment' },
  { id: 'TXN003', date: '2024-07-14', description: 'Monthly Salary', amount: 4500, type: 'income', category: 'Salary' },
  { id: 'TXN004', date: '2024-07-13', description: 'Gas Bill', amount: 65.0, type: 'expense', category: 'Utilities' },
  { id: 'TXN005', date: '2024-07-12', description: 'Freelance Project', amount: 750, type: 'income', category: 'Freelance' },
  { id: 'TXN006', date: '2024-07-11', description: 'Subway Fare', amount: 2.75, type: 'expense', category: 'Transport' },
  { id: 'TXN007', date: '2024-07-10', description: 'Apartment Rent', amount: 1200, type: 'expense', category: 'Rent' },
  { id: 'TXN008', date: '2024-07-09', description: 'Movie Tickets', amount: 30, type: 'expense', category: 'Entertainment' },
  { id: 'TXN009', date: '2024-07-08', description: 'Walmart', amount: 124.5, type: 'expense', category: 'Groceries' },
  { id: 'TXN010', date: '2024-07-01', description: 'Phone Bill', amount: 80, type: 'expense', category: 'Utilities' },
];

export const expenseData = [
    { category: 'Groceries', value: 410, fill: 'var(--color-chart-1)' },
    { category: 'Utilities', value: 200, fill: 'var(--color-chart-2)' },
    { category: 'Rent', value: 1200, fill: 'var(--color-chart-3)' },
    { category: 'Entertainment', value: 150, fill: 'var(--color-chart-4)' },
    { category: 'Transport', value: 80, fill: 'var(--color-chart-5)' },
];

export const cards = [
    { id: 'CARD01', cardName: 'Sapphire Preferred', last4: '1234', limit: 15000, dueDate: '2024-08-05', closingDate: '2024-07-10' },
    { id: 'CARD02', cardName: 'Freedom Unlimited', last4: '5678', limit: 7500, dueDate: '2024-08-15', closingDate: '2024-07-20' },
    { id: 'CARD03', cardName: 'Amex Gold', last4: '9012', limit: 20000, dueDate: '2024-08-25', closingDate: '2024-07-30' },
];

export const totalIncome = transactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
export const totalExpenses = transactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
export const balance = totalIncome - totalExpenses;
