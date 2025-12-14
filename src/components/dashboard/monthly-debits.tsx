'use client';

import { useMemo } from 'react';

import { addMonths, format, setDate, startOfMonth } from 'date-fns';
import { collection, query, where } from 'firebase/firestore';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useCollection, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { Card as CardType, Transaction } from '@/lib/types';

import { useLanguage } from '../i18n/language-provider';
import { Skeleton } from '../ui/skeleton';

const MonthlyDebitsSkeleton = () => {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Description</TableHead>
          <TableHead className="text-center">Date / Vencimento</TableHead>
          <TableHead className="text-right">Amount</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {Array.from({ length: 3 }).map((_, index) => (
          <TableRow key={index}>
            <TableCell>
              <Skeleton className="h-5 w-32" />
            </TableCell>
            <TableCell className="text-center">
              <Skeleton className="mx-auto h-5 w-24" />
            </TableCell>
            <TableCell className="text-right">
              <Skeleton className="ml-auto h-5 w-20" />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

interface MonthlyDebitsProps {
  transactions: Transaction[] | null;
  isLoading: boolean;
  currentDate: Date;
}

export function MonthlyDebits({ transactions, isLoading, currentDate }: MonthlyDebitsProps) {
  const firestore = useFirestore();
  const { user } = useUser();
  const { t, formatCurrency, formatDate, locale } = useLanguage();

  const cardsQuery = useMemoFirebase(() => {
    if (!user) return null;
    return collection(firestore, `users/${user.uid}/cards`);
  }, [firestore, user]);
  const { data: cards, isLoading: isLoadingCards } = useCollection<CardType>(cardsQuery);

  // Buscar transações do mês anterior para calcular as faturas que vencem no mês atual
  const previousMonthTransactionsQuery = useMemoFirebase(() => {
    if (!user) return null;

    const previousMonth = addMonths(currentDate, -1);
    const start = startOfMonth(previousMonth);
    const end = startOfMonth(currentDate);

    const startDate = format(start, 'yyyy-MM-dd');
    const endDate = format(end, 'yyyy-MM-dd');

    const q = query(
      collection(firestore, `users/${user.uid}/transactions`),
      where('date', '>=', startDate),
      where('date', '<', endDate),
      where('cardId', '!=', null),
    );

    return q;
  }, [firestore, user, currentDate]);

  const { data: previousMonthCardTransactions, isLoading: isLoadingPreviousMonth } =
    useCollection<Transaction>(previousMonthTransactionsQuery);

  const { directDebits, cardInvoices } = useMemo(() => {
    if (!transactions || !cards || !previousMonthCardTransactions) {
      return { directDebits: [], cardInvoices: [] };
    }

    const expenseTransactions = transactions.filter((t) => t.type === 'expense');

    // Débitos diretos são transações sem cartão (pagamentos diretos no mês)
    const directDebits = expenseTransactions.filter((t) => !t.cardId);

    // Faturas de cartão: transações do mês ANTERIOR que vencem no mês ATUAL
    // Exemplo: compras de Nov/2025 -> fatura vence em Dez/2025
    const cardInvoices = previousMonthCardTransactions
      .filter((t) => t.type === 'expense' && t.cardId)
      .reduce(
        (acc, t) => {
          if (!acc[t.cardId!]) {
            const card = cards.find((c) => c.id === t.cardId);
            // A fatura vence no mês atual (currentDate) no dia especificado no cartão
            const invoiceDueDate = card ? setDate(currentDate, card.dueDate) : null;
            acc[t.cardId!] = {
              cardName: card?.cardName || 'N/A',
              dueDate: invoiceDueDate,
              total: 0,
            };
          }
          acc[t.cardId!].total += t.amount - (t.deduction || 0);
          return acc;
        },
        {} as Record<string, { cardName: string; dueDate: Date | null; total: number }>,
      );

    return { directDebits, cardInvoices: Object.values(cardInvoices) };
  }, [transactions, cards, currentDate, previousMonthCardTransactions]);

  const allDebits = [
    ...directDebits.map((d) => ({ ...d, isInvoice: false })),
    ...cardInvoices.map((i) => ({ ...i, isInvoice: true })),
  ];

  const formatInvoiceDueDate = (date: Date) => {
    return new Intl.DateTimeFormat(locale, {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(date);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">{t('dashboard.monthly_debits.title')}</CardTitle>
        <CardDescription>{t('dashboard.monthly_debits.description')}</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading || isLoadingCards || isLoadingPreviousMonth ? (
          <MonthlyDebitsSkeleton />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('description')}</TableHead>
                <TableHead className="text-center">
                  {t('date')} / {t('due_date')}
                </TableHead>
                <TableHead className="text-right">{t('amount')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!isLoading && allDebits.length === 0 && (
                <TableRow>
                  <TableCell colSpan={3} className="text-center">
                    {t('dashboard.monthly_debits.empty')}
                  </TableCell>
                </TableRow>
              )}

              {directDebits.map((debit) => (
                <TableRow key={debit.id}>
                  <TableCell>{debit.description}</TableCell>
                  <TableCell className="text-center">{formatDate(debit.date)}</TableCell>
                  <TableCell className="text-right text-destructive">
                    -{formatCurrency(debit.amount - (debit.deduction || 0))}
                  </TableCell>
                </TableRow>
              ))}

              {cardInvoices.map((invoice, index) => (
                <TableRow key={`invoice-${index}`}>
                  <TableCell className="font-medium">
                    {t('invoice_for')} {invoice.cardName}
                  </TableCell>
                  <TableCell className="text-center">
                    {invoice.dueDate ? formatInvoiceDueDate(invoice.dueDate) : 'N/A'}
                  </TableCell>
                  <TableCell className="text-right font-bold text-destructive">
                    -{formatCurrency(invoice.total)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
