'use client';

import { useState } from 'react';

import { Row } from '@tanstack/react-table';
import { collection, doc, getDocs, query, where, writeBatch } from 'firebase/firestore';
import { Pencil, Trash2 } from 'lucide-react';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button, buttonVariants } from '@/components/ui/button';
import { useFirestore, useUser } from '@/firebase';
import { deleteDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { Transaction } from '@/lib/types';
import { cn } from '@/lib/utils';

import { useLanguage } from '../i18n/language-provider';

interface DataTableRowActionsProps<TData> {
  row: Row<TData>;
  onEdit: (transaction: TData) => void;
}

export function DataTableRowActions<TData extends Transaction>({
  row,
  onEdit,
}: DataTableRowActionsProps<TData>) {
  const transaction = row.original;
  const firestore = useFirestore();
  const { user } = useUser();
  const { t } = useLanguage();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const handleDelete = async () => {
    if (!user || !firestore) return;

    if (transaction.groupId) {
      const batch = writeBatch(firestore);
      const transactionsQuery = query(
        collection(firestore, `users/${user.uid}/transactions`),
        where('groupId', '==', transaction.groupId),
      );
      const querySnapshot = await getDocs(transactionsQuery);
      querySnapshot.forEach((doc) => {
        batch.delete(doc.ref);
      });
      await batch.commit();
    } else {
      const transactionRef = doc(firestore, `users/${user.uid}/transactions/${transaction.id}`);
      deleteDocumentNonBlocking(transactionRef);
    }

    setIsDeleteDialogOpen(false);
  };

  const isInstallment = transaction.installments && transaction.installments > 1;

  return (
    <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
      <div className="flex items-center space-x-2">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(transaction)}>
          <Pencil className="h-4 w-4" />
          <span className="sr-only">{t('edit')}</span>
        </Button>
        <AlertDialogTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
            <span className="sr-only">{t('delete')}</span>
          </Button>
        </AlertDialogTrigger>
      </div>

      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('are_you_sure')}</AlertDialogTitle>
          <AlertDialogDescription>
            {isInstallment
              ? t('transactions.delete_installment_description')
              : t('transactions.delete_description')}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            className={cn(buttonVariants({ variant: 'destructive' }))}
          >
            {t('continue')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
