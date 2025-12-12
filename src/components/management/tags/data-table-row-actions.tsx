
"use client"

import { Row } from "@tanstack/react-table"
import { MoreHorizontal } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
import { Tag } from "@/lib/types"
import { useFirestore, useUser } from "@/firebase"
import { deleteDocumentNonBlocking } from "@/firebase/non-blocking-updates"
import { doc } from "firebase/firestore"

interface DataTableRowActionsProps<TData> {
  row: Row<TData>
  onEdit: (data: TData) => void
}

export function DataTableRowActions<TData extends Tag>({
  row,
  onEdit,
}: DataTableRowActionsProps<TData>) {
  const item = row.original
  const firestore = useFirestore();
  const { user } = useUser();

  const handleDelete = () => {
    if (user) {
      const itemRef = doc(firestore, `users/${user.uid}/tags/${item.id}`);
      deleteDocumentNonBlocking(itemRef);
    }
  }

  return (
    <AlertDialog>
        <DropdownMenu>
        <DropdownMenuTrigger asChild>
            <Button
            variant="ghost"
            className="flex h-8 w-8 p-0 data-[state=open]:bg-muted"
            >
            <MoreHorizontal className="h-4 w-4" />
            <span className="sr-only">Open menu</span>
            </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-[160px]">
            <DropdownMenuItem onClick={() => onEdit(item)}>Edit</DropdownMenuItem>
            <DropdownMenuSeparator />
            <AlertDialogTrigger asChild>
                <DropdownMenuItem className="text-red-600">Delete</DropdownMenuItem>
            </AlertDialogTrigger>
        </DropdownMenuContent>
        </DropdownMenu>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete this tag.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete}>Continue</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
