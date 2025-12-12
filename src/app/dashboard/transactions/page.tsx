
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
  import { transactions } from "@/lib/data"
  import { AddTransactionSheet } from "@/components/transactions/add-transaction-sheet"
import { ClientOnly } from "@/components/client-only"
  
  export default function TransactionsPage() {
    return (
        <>
            <div className="flex items-center">
                <h1 className="text-3xl font-bold tracking-tight font-headline">Transactions</h1>
            </div>
            <Tabs defaultValue="all">
              <div className="flex items-center">
                <TabsList>
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="income">Income</TabsTrigger>
                  <TabsTrigger value="expenses">Expenses</TabsTrigger>
                </TabsList>
                <div className="ml-auto flex items-center gap-2">
                  <Button size="sm" variant="outline" className="h-8 gap-1">
                    <File className="h-3.5 w-3.5" />
                    <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                      Export
                    </span>
                  </Button>
                  <AddTransactionSheet />
                </div>
              </div>
              <TabsContent value="all">
                <ClientOnly>
                  <DataTable columns={columns} data={transactions} />
                </ClientOnly>
              </TabsContent>
            </Tabs>
        </>
    )
  }
  