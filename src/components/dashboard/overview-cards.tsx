'use client';

import { useMemo } from 'react';

import { ArrowDown, ArrowUp, Scale } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Transaction } from '@/lib/types';
import { cn } from '@/lib/utils';

import { useLanguage } from '../i18n/language-provider';
import { Skeleton } from '../ui/skeleton';

interface OverviewCardsProps {
  transactions: Transaction[] | null;
  isLoading: boolean;
}

const OverviewSkeleton = () => (
  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
    {Array.from({ length: 3 }).map((_, i) => (
      <Card key={i}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-4" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-7 w-32" />
          <Skeleton className="mt-2 h-3 w-40" />
        </CardContent>
      </Card>
    ))}
  </div>
);

export function OverviewCards({ transactions, isLoading }: OverviewCardsProps) {
  const { t, formatCurrency } = useLanguage();

  const { totalIncome, totalExpenses, balance } = useMemo(() => {
    if (!transactions) {
      return { totalIncome: 0, totalExpenses: 0, balance: 0 };
    }
    const income = transactions
      .filter((t) => t.type === 'income')
      .reduce((acc, t) => acc + t.amount, 0);
    const expenses = transactions
      .filter((t) => t.type === 'expense')
      .reduce((acc, t) => acc + (t.amount - (t.deduction || 0)), 0);
    return {
      totalIncome: income,
      totalExpenses: expenses,
      balance: income - expenses,
    };
  }, [transactions]);

  if (isLoading) {
    return <OverviewSkeleton />;
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <Card className="bg-green-600 text-white">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{t('dashboard.total_income')}</CardTitle>
          <ArrowUp className="h-4 w-4" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(totalIncome)}</div>
        </CardContent>
      </Card>
      <Card className="bg-red-600 text-white">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{t('dashboard.total_expenses')}</CardTitle>
          <ArrowDown className="h-4 w-4" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(totalExpenses)}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{t('dashboard.balance')}</CardTitle>
          <Scale className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div
            className={cn(
              'text-2xl font-bold',
              balance < 0 ? 'text-destructive' : 'text-green-600',
            )}
          >
            {formatCurrency(balance)}
          </div>
          <p className="text-xs text-muted-foreground">{t('dashboard.balance_description')}</p>
        </CardContent>
      </Card>
    </div>
  );
}
