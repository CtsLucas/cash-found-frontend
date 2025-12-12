
"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Transaction } from "@/lib/types"
import { DataTableRowActions } from "./data-table-row-actions"
import { useState, useEffect, useMemo } from "react"
import { useCollection, useFirestore, useUser, useMemoFirebase } from "@/firebase"
import { collection } from "firebase/firestore"
import { Category, Tag, Card } from "@/lib/types"

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
};


export const columns = (onEdit: (transaction: Transaction) => void): ColumnDef<Transaction>[] => [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
        className="translate-y-[2px]"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
        className="translate-y-[2px]"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "description",
    header: "Description",
    cell: ({ row }) => {
      return (
        <div className="flex space-x-2">
          <span className="max-w-[300px] truncate font-medium">
            {row.getValue("description")}
          </span>
        </div>
      )
    },
  },
  {
    accessorKey: "category",
    header: "Category",
    cell: ({ row, table }) => {
        const categoryId = row.getValue("category") as string;
        const { categories } = (table.options.meta as { categories: Category[] })
        const category = categories?.find(c => c.id === categoryId);

      return (
        <Badge variant="outline">{category?.name || "..."}</Badge>
      )
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id))
    },
  },
  {
    accessorKey: "tags",
    header: "Tags",
    cell: ({ row, table }) => {
        const tagIds = row.getValue("tags") as string[] | undefined;
        const { tags } = (table.options.meta as { tags: Tag[] })
        
        if (!tagIds || tagIds.length === 0) {
            return null;
        }

        const tagNames = tagIds.map(tagId => {
            const tag = tags?.find(t => t.id === tagId);
            return tag ? tag.name : '';
        }).filter(name => name);

        return (
            <div className="flex space-x-1">
                {tagNames.map(name => (
                    <Badge key={name} variant="secondary">{name}</Badge>
                ))}
            </div>
        )
    }
  },
  {
    accessorKey: "cardId",
    header: "Card",
    cell: ({ row, table }) => {
        const cardId = row.getValue("cardId") as string;
        const { cards } = (table.options.meta as { cards: Card[] })
        
        if (!cardId) {
            return null;
        }

        const card = cards?.find(c => c.id === cardId);

        return card ? (
            <Badge style={{ backgroundColor: card.color }} className="text-white">
                {card.cardName}
            </Badge>
        ) : null;
    }
  },
  {
    accessorKey: "installments",
    header: () => <div className="text-center">Installments</div>,
    cell: ({ row }) => {
      const installments = row.original.installments as number | undefined;
      const currentInstallment = row.original.currentInstallment as number | undefined;
      
      if (!installments || installments <= 1) {
        return <div className="text-center text-muted-foreground">-</div>;
      }
      
      if (currentInstallment) {
        return (
            <div className="text-center">
                {currentInstallment}/{installments}
            </div>
        )
      }

      return (
        <div className="text-center">
            {installments}
        </div>
      )
    },
  },
  {
    accessorKey: "date",
    header: "Date",
    cell: ({ row }) => {
        const dateString = row.getValue("date") as string;
        const [clientDate, setClientDate] = useState<string | null>(null);

        useEffect(() => {
          // The date string from the data is 'YYYY-MM-DD'.
          // We need to parse it correctly to avoid timezone issues.
          // By splitting the string and creating a date, we treat it as local time.
          const parts = dateString.split('-').map(part => parseInt(part, 10));
          const date = new Date(parts[0], parts[1] - 1, parts[2]);
          setClientDate(date.toLocaleDateString());
        }, [dateString]);
        
        return (
            <div>{clientDate}</div>
        )
    }
  },
  {
    accessorKey: "amount",
    header: () => <div className="text-right">Amount</div>,
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue("amount"))
      const { type, deduction } = row.original
      
      if (type === 'income') {
        return <div className={`text-right font-medium text-green-500`}>+{formatCurrency(amount)}</div>
      }

      const finalAmount = amount - (deduction || 0)
      
      return (
        <div className="text-right font-medium text-destructive">
            {deduction ? (
                <div>
                    <span>-{formatCurrency(finalAmount)}</span>
                    <div className="text-xs text-muted-foreground line-through">
                        {formatCurrency(amount)}
                    </div>
                </div>
            ) : (
                <span>-{formatCurrency(amount)}</span>
            )}
        </div>
      )
    },
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => <DataTableRowActions row={row} onEdit={onEdit} />,
  },
]
