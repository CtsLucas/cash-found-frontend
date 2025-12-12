"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Transaction } from "@/lib/types"
import { DataTableRowActions } from "./data-table-row-actions"

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
    accessorKey: "amount",
    header: () => <div className="text-right">Amount</div>,
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue("amount"))
      const type = row.original.type
      const formatted = formatCurrency(amount);

      return <div className={`text-right font-medium ${type === 'income' ? 'text-green-500' : 'text-red-500'}`}>{type === 'income' ? '+' : '-'}{formatted}</div>
    },
  },
  {
    accessorKey: "date",
    header: "Date",
    cell: ({ row }) => {
        const date = new Date(row.getValue("date"))
        const formattedDate = date.toLocaleDateString()
        return (
            <div>{formattedDate}</div>
        )
    }
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
        const status = row.getValue("status") as string
      return (
        <Badge variant={status === 'completed' ? 'default' : status === 'pending' ? 'secondary' : 'destructive'}>{status}</Badge>
      )
    },
    filterFn: (row, id, value) => {
        return value.includes(row.getValue(id))
      },
  },
  {
    id: "actions",
    cell: ({ row }) => <DataTableRowActions row={row} />,
  },
]
