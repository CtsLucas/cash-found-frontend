"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Transaction } from "@/lib/types"
import { DataTableRowActions } from "./data-table-row-actions"
import { useState, useEffect } from "react"

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
};


export const columns: ColumnDef<Transaction>[] = [
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
    cell: ({ row }) => {
      return (
        <Badge variant="outline">{row.getValue("category")}</Badge>
      )
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id))
    },
  },
  {
    accessorKey: "tags",
    header: "Tags",
    cell: ({ row }) => {
        const tags = row.getValue("tags") as string[] | undefined;
        if (!tags || tags.length === 0) {
            return null;
        }
        return (
            <div className="flex space-x-1">
                {tags.map(tag => (
                    <Badge key={tag} variant="secondary">{tag}</Badge>
                ))}
            </div>
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
        <div className="text-right font-medium text-red-500">
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
    id: "actions",
    cell: ({ row }) => <DataTableRowActions row={row} />,
  },
]
