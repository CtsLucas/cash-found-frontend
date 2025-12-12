
'use client'

import {
    File,
  } from "lucide-react"
  
  import { Button } from "@/components/ui/button"

  import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
  } from "@/components/ui/tabs"
  import { DataTable } from "@/components/transactions/data-table"
  import { columns } from "@/components/transactions/columns"
  import { AddTransactionSheet } from "@/components/transactions/add-transaction-sheet"
import { ClientOnly } from "@/components/client-only"
import { useCollection, useFirestore, useUser, useMemoFirebase } from "@/firebase"
import { collection, query, where } from "firebase/firestore"
import { useMemo, useState } from "react"
import { Transaction } from "@/lib/types"
import { MonthYearPicker } from "@/components/transactions/month-year-picker"
import { startOfMonth, endOfMonth, format } from "date-fns"
  
  export default function TransactionsPage() {
    const firestore = useFirestore();
    const { user } = useUser();
    const [filter, setFilter] = useState('all');
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
          where('date', '<=', endDate)
        );

        if (filter !== 'all') {
            return query(q, where('type', '==', filter));
        }
        return q;
    }, [firestore, user, filter, currentDate]);

    const { data: transactions, isLoading } = useCollection<Transaction>(transactionsQuery);

    const filteredTransactions = useMemo(() => {
        if (!transactions) return [];
        return transactions;
    }, [transactions]);
    
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
            <Tabs defaultValue="all" onValueChange={setFilter}>
              <div className="flex items-center">
                <TabsList>
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="income">Income</TabsTrigger>
                  <TabsTrigger value="expense">Expenses</TabsTrigger>
                </TabsList>
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
              <div className="py-4">
                <MonthYearPicker date={currentDate} setDate={setCurrentDate} />
              </div>
              <TabsContent value="all">
                <ClientOnly>
                  {isLoading ? <p>Loading...</p> : <DataTable columns={columns(handleEdit)} data={filteredTransactions} />}
                </ClientOnly>
              </TabsContent>
              <TabsContent value="income">
                <ClientOnly>
                  {isLoading ? <p>Loading...</p> : <DataTable columns={columns(handleEdit)} data={filteredTransactions} />}
                </ClientOnly>
              </TabsContent>
              <TabsContent value="expense">
                <ClientOnly>
                  {isLoading ? <p>Loading...</p> : <DataTable columns={columns(handleEdit)} data={filteredTransactions} />}
                </ClientOnly>
              </TabsContent>
            </Tabs>
        </>
    )
  }
