
'use client'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowUp, ArrowDown, Scale } from "lucide-react";
import { Transaction } from "@/lib/types";
import { useMemo } from "react";
import { Skeleton } from "../ui/skeleton";
import { cn } from "@/lib/utils";

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
};

interface OverviewCardsProps {
  transactions: Transaction[] | null;
  isLoading: boolean;
}

const OverviewSkeleton = () => (
  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
    {Array.from({ length: 3 }).map((_, i) => (
      <Card key={i}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-4" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-7 w-32" />
          <Skeleton className="h-3 w-40 mt-2" />
        </CardContent>
      </Card>
    ))}
  </div>
);

export function OverviewCards({ transactions, isLoading }: OverviewCardsProps) {
  const { totalIncome, totalExpenses, balance } = useMemo(() => {
    if (!transactions) {
      return { totalIncome: 0, totalExpenses: 0, balance: 0 };
    }
    const income = transactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
    const expenses = transactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + (t.amount - (t.deduction || 0)), 0);
    return {
      totalIncome: income,
      totalExpenses: expenses,
      balance: income - expenses
    };
  }, [transactions]);
  
  if (isLoading) {
    return <OverviewSkeleton />;
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <Card className="bg-green-600 text-white">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Income</CardTitle>
          <ArrowUp className="h-4 w-4" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(totalIncome)}</div>
          {/* <p className="text-xs text-muted-foreground">+20.1% from last month</p> */}
        </CardContent>
      </Card>
      <Card className="bg-red-600 text-white">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
          <ArrowDown className="h-4 w-4" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(totalExpenses)}</div>
          {/* <p className="text-xs text-muted-foreground">+18.1% from last month</p> */}
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Balance</CardTitle>
          <Scale className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className={cn("text-2xl font-bold", balance < 0 ? 'text-destructive' : 'text-green-600')}>{formatCurrency(balance)}</div>
          <p className="text-xs text-muted-foreground">Your account balance this month</p>
        </CardContent>
      </Card>
    </div>
  );
}
