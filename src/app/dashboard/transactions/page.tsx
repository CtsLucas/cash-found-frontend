
'use client'

import {
    File,
    PlusCircle,
  } from "lucide-react"
  
  import { Button } from "@/components/ui/button"

  import { DataTable } from "@/components/transactions/data-table"
  import { columns } from "@/components/transactions/columns"
  import { AddTransactionSheet } from "@/components/transactions/add-transaction-sheet"
import { ClientOnly } from "@/components/client-only"
import { useCollection, useFirestore, useUser, useMemoFirebase } from "@/firebase"
import { collection, query, where, orderBy } from "firebase/firestore"
import { useMemo, useState } from "react"
import { Transaction } from "@/lib/types"
import { MonthYearPicker } from "@/components/transactions/month-year-picker"
import { startOfMonth, endOfMonth, format } from "date-fns"
import { DataTableSkeleton } from "@/components/transactions/data-table-skeleton"
import { EmptyState } from "@/components/empty-state"
  
  export default function TransactionsPage() {
    const firestore = useFirestore();
    const { user } = useUser();
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
    const [currentDate, setCurrentDate] = useState(new Date());

    const transactionsQuery = useMemoFirebase(() => {
        if (!user) return null;

        const start = startOfMonth(currentDate);
        const end = endOfMonth(currentDate);
        
        const startDate = format(start, 'yyyy-MM-dd');
        const endDate = format(end, 'yyyy-MM-dd');

        let q = query(
          collection(firestore, `users/${user.uid}/transactions`),
          where('date', '>=', startDate),
          where('date', '<=', endDate),
          orderBy('date', 'desc')
        );

        return q;
    }, [firestore, user, currentDate]);

    const { data: transactions, isLoading } = useCollection<Transaction>(transactionsQuery);
    
    const handleEdit = (transaction: Transaction) => {
        setEditingTransaction(transaction);
        setIsSheetOpen(true);
    }

    const handleSheetOpenChange = (isOpen: boolean) => {
        setIsSheetOpen(isOpen);
        if (!isOpen) {
            setEditingTransaction(null);
        }
    }
    
    return (
        <>
            <div className="flex items-center">
                <h1 className="text-3xl font-bold tracking-tight font-headline">Transactions</h1>
            </div>
            <div className="flex items-center">
                <MonthYearPicker date={currentDate} setDate={setCurrentDate} />
                <div className="ml-auto flex items-center gap-2">
                    <Button size="sm" variant="outline" className="h-8 gap-1">
                        <File className="h-3.5 w-3.5" />
                        <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                        Export
                        </span>
                    </Button>
                    <AddTransactionSheet isOpen={isSheetOpen} onOpenChange={handleSheetOpenChange} editingTransaction={editingTransaction} />
                </div>
            </div>
            <div>
                <ClientOnly>
                  {isLoading ? <DataTableSkeleton columnCount={columns(handleEdit).length} /> : 
                    (transactions && transactions.length > 0) ? (
                      <DataTable columns={columns(handleEdit)} data={transactions} />
                    ) : (
                      <EmptyState
                        icon={PlusCircle}
                        title="No transactions found"
                        description="Get started by adding your first transaction for this period."
                      >
                         <AddTransactionSheet isOpen={isSheetOpen} onOpenChange={handleSheetOpenChange} editingTransaction={editingTransaction} />
                      </EmptyState>
                    )
                  }
                </ClientOnly>
            </div>
        </>
    )
  }
