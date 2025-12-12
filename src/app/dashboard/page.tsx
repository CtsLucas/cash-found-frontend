
'use client'

import { OverviewCards } from "@/components/dashboard/overview-cards";
import { ExpenseChart } from "@/components/dashboard/expense-chart";
import { RecentTransactions } from "@/components/dashboard/recent-transactions";
import { MonthYearPicker } from "@/components/transactions/month-year-picker";
import { useState } from "react";
import { useCollection, useFirestore, useMemoFirebase, useUser } from "@/firebase";
import { collection, query, where } from "firebase/firestore";
import { Transaction } from "@/lib/types";
import { startOfMonth, format, addMonths } from "date-fns";
import { MonthlyDebits } from "@/components/dashboard/monthly-debits";

export default function DashboardPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const firestore = useFirestore();
  const { user } = useUser();

  const transactionsQuery = useMemoFirebase(() => {
    if (!user) return null;

    const start = startOfMonth(currentDate);
    const nextMonthStart = startOfMonth(addMonths(currentDate, 1));
    
    const startDate = format(start, 'yyyy-MM-dd');
    const endDate = format(nextMonthStart, 'yyyy-MM-dd');

    let q = query(
      collection(firestore, `users/${user.uid}/transactions`),
      where('date', '>=', startDate),
      where('date', '<', endDate)
    );

    return q;
  }, [firestore, user, currentDate]);

  const { data: transactions, isLoading } = useCollection<Transaction>(transactionsQuery);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight font-headline">Dashboard</h1>
        <MonthYearPicker date={currentDate} setDate={setCurrentDate} />
      </div>
      <OverviewCards transactions={transactions} isLoading={isLoading} />
      <MonthlyDebits transactions={transactions} isLoading={isLoading} />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <div className="lg:col-span-4">
          <RecentTransactions />
        </div>
        <div className="lg:col-span-3">
          <ExpenseChart transactions={transactions} isLoading={isLoading} date={currentDate} />
        </div>
      </div>
    </div>
  );
}
