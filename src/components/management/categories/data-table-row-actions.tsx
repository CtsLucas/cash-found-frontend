
"use client"

import { Row } from "@tanstack/react-table"
import { Pencil, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
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
import { Category } from "@/lib/types"
import { useFirestore, useUser } from "@/firebase"
import { deleteDocumentNonBlocking } from "@/firebase/non-blocking-updates"
import { doc } from "firebase/firestore"
import { useState } from "react"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface DataTableRowActionsProps<TData> {
  row: Row<TData>
  onEdit: (data: TData) => void;
}

export function DataTableRowActions<TData extends Category>({
  row,
  onEdit
}: DataTableRowActionsProps<TData>) {
  const item = row.original
  const firestore = useFirestore();
  const { user } = useUser();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const handleDelete = () => {
    if (user) {
      const itemRef = doc(firestore, `users/${user.uid}/categories/${item.id}`);
      deleteDocumentNonBlocking(itemRef);
      setIsDeleteDialogOpen(false);
    }
  }

  return (
    <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
      <div className="flex items-center space-x-2">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => onEdit(item)}
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
            This action cannot be undone. This will permanently delete this category.
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
