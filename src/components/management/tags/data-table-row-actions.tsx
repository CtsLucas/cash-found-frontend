'use client';

import { useState } from 'react';

import { Row } from '@tanstack/react-table';
import { doc } from 'firebase/firestore';
import { Pencil, Trash2 } from 'lucide-react';

import { useLanguage } from '@/components/i18n/language-provider';
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
import { Button } from '@/components/ui/button';
import { buttonVariants } from '@/components/ui/button';
import { useFirestore, useUser } from '@/firebase';
import { deleteDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { Tag } from '@/lib/types';
import { cn } from '@/lib/utils';

interface DataTableRowActionsProps<TData> {
  row: Row<TData>;
  onEdit: (data: TData) => void;
}

export function DataTableRowActions<TData extends Tag>({
  row,
  onEdit,
}: DataTableRowActionsProps<TData>) {
  const item = row.original;
  const firestore = useFirestore();
  const { user } = useUser();
  const { t } = useLanguage();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const handleDelete = () => {
    if (user) {
      const itemRef = doc(firestore, `users/${user.uid}/tags/${item.id}`);
      deleteDocumentNonBlocking(itemRef);
      setIsDeleteDialogOpen(false);
    }
  };

  return (
    <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
      <div className="flex items-center space-x-2">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(item)}>
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
          <AlertDialogDescription>{t('management.tags.delete_description')}</AlertDialogDescription>
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
