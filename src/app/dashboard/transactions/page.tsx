'use client';

import { useMemo, useState } from 'react';

import { addMonths, format, startOfMonth } from 'date-fns';
import { collection, orderBy, query, where } from 'firebase/firestore';
import { File, PlusCircle } from 'lucide-react';

import { ClientOnly } from '@/components/client-only';
import { EmptyState } from '@/components/empty-state';
import { useLanguage } from '@/components/i18n/language-provider';
import { AddTransactionSheet } from '@/components/transactions/add-transaction-sheet';
import { columns } from '@/components/transactions/columns';
import { DataTable } from '@/components/transactions/data-table';
import { DataTableSkeleton } from '@/components/transactions/data-table-skeleton';
import { MonthYearPicker } from '@/components/transactions/month-year-picker';
import { Button } from '@/components/ui/button';
import { useCollection, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { Transaction } from '@/lib/types';

export default function TransactionsPage() {
  const firestore = useFirestore();
  const { user } = useUser();
  const { t, formatCurrency, formatDate } = useLanguage();
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date());

  const transactionsQuery = useMemoFirebase(() => {
    if (!user) return null;

    const start = startOfMonth(currentDate);
    const nextMonthStart = startOfMonth(addMonths(currentDate, 1));

    const startDate = format(start, 'yyyy-MM-dd');
    const endDate = format(nextMonthStart, 'yyyy-MM-dd');

    const q = query(
      collection(firestore, `users/${user.uid}/transactions`),
      where('date', '>=', startDate),
      where('date', '<', endDate),
      orderBy('date', 'desc'),
    );

    return q;
  }, [firestore, user, currentDate]);

  const { data: transactions, isLoading } = useCollection<Transaction>(transactionsQuery);

  const handleEdit = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setIsSheetOpen(true);
  };

  const handleSheetOpenChange = (isOpen: boolean) => {
    setIsSheetOpen(isOpen);
    if (!isOpen) {
      setEditingTransaction(null);
    }
  };

  const memoizedColumns = useMemo(
    () => columns(handleEdit, t, { formatCurrency, formatDate }),
    [t, formatCurrency, formatDate],
  );

  return (
    <>
      <div className="flex items-center">
        <h1 className="font-headline text-3xl font-bold tracking-tight">
          {t('transactions.title')}
        </h1>
      </div>
      <div className="flex items-center">
        <MonthYearPicker date={currentDate} setDate={setCurrentDate} />
        <div className="ml-auto flex items-center gap-2">
          <Button size="sm" variant="outline" className="h-8 gap-1">
            <File className="h-3.5 w-3.5" />
            <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">{t('export')}</span>
          </Button>
          <AddTransactionSheet
            isOpen={isSheetOpen}
            onOpenChange={handleSheetOpenChange}
            editingTransaction={editingTransaction}
          />
        </div>
      </div>
      <div>
        <ClientOnly>
          {isLoading ? (
            <DataTableSkeleton columnCount={memoizedColumns.length} />
          ) : transactions && transactions.length > 0 ? (
            <DataTable columns={memoizedColumns} data={transactions} />
          ) : (
            <EmptyState
              icon={PlusCircle}
              title={t('transactions.empty.title')}
              description={t('transactions.empty.description')}
            >
              <AddTransactionSheet
                isOpen={isSheetOpen}
                onOpenChange={handleSheetOpenChange}
                editingTransaction={editingTransaction}
              />
            </EmptyState>
          )}
        </ClientOnly>
      </div>
    </>
  );
}
