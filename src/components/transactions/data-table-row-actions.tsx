
"use client"

import { Row } from "@tanstack/react-table"
import { Pencil, Trash2 } from "lucide-react"
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
} from "@/components/ui/alert-dialog"

import { Button, buttonVariants } from "@/components/ui/button"
import { Transaction } from "@/lib/types"
import { useFirestore, useUser } from "@/firebase"
import { collection, deleteDoc, doc, getDocs, query, where, writeBatch } from "firebase/firestore"
import { deleteDocumentNonBlocking } from "@/firebase/non-blocking-updates"
import { useState } from "react"
import { cn } from "@/lib/utils"


interface DataTableRowActionsProps<TData> {
  row: Row<TData>
  onEdit: (transaction: TData) => void;
}

export function DataTableRowActions<TData extends Transaction>({
  row,
  onEdit
}: DataTableRowActionsProps<TData>) {
  const transaction = row.original
  const firestore = useFirestore();
  const { user } = useUser();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const handleDelete = async () => {
    if (!user || !firestore) return;

    if (transaction.groupId) {
        const batch = writeBatch(firestore);
        const transactionsQuery = query(
            collection(firestore, `users/${user.uid}/transactions`),
            where('groupId', '==', transaction.groupId)
        );
        const querySnapshot = await getDocs(transactionsQuery);
        querySnapshot.forEach(doc => {
            batch.delete(doc.ref);
        });
        await batch.commit();
    } else {
        const transactionRef = doc(firestore, `users/${user.uid}/transactions/${transaction.id}`);
        deleteDocumentNonBlocking(transactionRef);
    }
    
    setIsDeleteDialogOpen(false);
  }

  const isInstallment = transaction.installments && transaction.installments > 1;

  return (
    <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
      <div className="flex items-center space-x-2">
        <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => onEdit(transaction)}
        >
            <Pencil className="h-4 w-4" />
            <span className="sr-only">Edit</span>
        </Button>
        <AlertDialogTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive">
                <Trash2 className="h-4 w-4" />
                <span className="sr-only">Delete</span>
            </Button>
        </AlertDialogTrigger>
      </div>

      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
          <AlertDialogDescription>
            {isInstallment 
              ? "This action cannot be undone. This will permanently delete this transaction and all its related installments."
              : "This action cannot be undone. This will permanently delete the transaction."
            }
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete} className={cn(buttonVariants({ variant: "destructive" }))}>Continue</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
