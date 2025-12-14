'use client';

import { collection, limit, orderBy, query } from 'firebase/firestore';

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
import { Transaction } from '@/lib/types';

import { useLanguage } from '../i18n/language-provider';
import { Skeleton } from '../ui/skeleton';

const RecentTransactionsSkeleton = () => {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Description</TableHead>
          <TableHead className="hidden sm:table-cell">Type</TableHead>
          <TableHead className="text-right">Amount</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {Array.from({ length: 5 }).map((_, index) => (
          <TableRow key={index}>
            <TableCell>
              <Skeleton className="h-5 w-32" />
              <Skeleton className="mt-1 h-4 w-24" />
            </TableCell>
            <TableCell className="hidden sm:table-cell">
              <Skeleton className="h-5 w-16" />
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

export function RecentTransactions() {
  const firestore = useFirestore();
  const { user } = useUser();
  const { t, formatCurrency } = useLanguage();

  const recentTransactionsQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(
      collection(firestore, `users/${user.uid}/transactions`),
      orderBy('date', 'desc'),
      limit(5),
    );
  }, [firestore, user]);

  const { data: recentTransactions, isLoading } =
    useCollection<Transaction>(recentTransactionsQuery);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">{t('dashboard.recent_transactions.title')}</CardTitle>
        <CardDescription>{t('dashboard.recent_transactions.description')}</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <RecentTransactionsSkeleton />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('description')}</TableHead>
                <TableHead className="hidden sm:table-cell">{t('type')}</TableHead>
                <TableHead className="text-right">{t('amount')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!isLoading && recentTransactions?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={3} className="text-center">
                    {t('dashboard.recent_transactions.empty')}
                  </TableCell>
                </TableRow>
              )}
              {recentTransactions?.map((transaction) => {
                const amount =
                  transaction.type === 'expense'
                    ? transaction.amount - (transaction.deduction || 0)
                    : transaction.amount;

                return (
                  <TableRow key={transaction.id}>
                    <TableCell>
                      <div className="font-medium">{transaction.description}</div>
                      <div className="hidden text-sm text-muted-foreground md:inline">
                        {transaction.category}
                      </div>
                    </TableCell>
                    <TableCell className="hidden capitalize sm:table-cell">
                      {t(transaction.type)}
                    </TableCell>
                    <TableCell
                      className={`text-right ${transaction.type === 'income' ? 'text-green-500' : 'text-red-500'}`}
                    >
                      {transaction.type === 'income' ? '+' : '-'}
                      {formatCurrency(amount)}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
