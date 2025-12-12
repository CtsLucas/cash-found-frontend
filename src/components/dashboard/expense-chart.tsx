
"use client"

import { Pie, PieChart, Cell } from "recharts"
import { useMemo } from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart"
import { Transaction, Category } from "@/lib/types"
import { useCollection, useFirestore, useUser, useMemoFirebase } from "@/firebase"
import { collection } from "firebase/firestore"
import { Skeleton } from "../ui/skeleton"
import { format } from "date-fns"

const CHART_COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
  '#f59e0b',
  '#10b981',
  '#3b82f6',
  '#6366f1',
  '#8b5cf6',
  '#ec4899',
]

interface ExpenseChartProps {
  transactions: Transaction[] | null;
  isLoading: boolean;
  date: Date;
}

const ExpenseChartSkeleton = () => (
  <Card className="flex flex-col">
    <CardHeader>
      <Skeleton className="h-6 w-40" />
      <Skeleton className="h-4 w-32" />
    </CardHeader>
    <CardContent className="flex-1 pb-0 flex items-center justify-center">
      <Skeleton className="aspect-square h-[250px] w-[250px] rounded-full" />
    </CardContent>
  </Card>
);

export function ExpenseChart({ transactions, isLoading, date }: ExpenseChartProps) {
  const firestore = useFirestore();
  const { user } = useUser();

  const categoriesQuery = useMemoFirebase(() => {
    if (!user) return null;
    return collection(firestore, `users/${user.uid}/categories`);
  }, [firestore, user]);
  const { data: categories } = useCollection<Category>(categoriesQuery);

  const { expenseData, chartConfig } = useMemo(() => {
    if (!transactions || !categories) {
      return { expenseData: [], chartConfig: {} };
    }

    const expensesByCategory = transactions
      .filter(t => t.type === 'expense')
      .reduce((acc, t) => {
        const categoryName = categories.find(c => c.id === t.category)?.name || 'Uncategorized';
        if (!acc[categoryName]) {
          acc[categoryName] = 0;
        }
        acc[categoryName] += t.amount - (t.deduction || 0);
        return acc;
      }, {} as Record<string, number>);

    const data = Object.entries(expensesByCategory).map(([category, value], index) => ({
      category,
      value,
      fill: CHART_COLORS[index % CHART_COLORS.length],
    })).sort((a, b) => b.value - a.value);

    const config = {
      value: { label: "Value" },
      ...data.reduce((acc, item) => {
        acc[item.category] = {
          label: item.category,
          color: item.fill,
        };
        return acc;
      }, {} as any),
    };

    return { expenseData: data, chartConfig: config };
  }, [transactions, categories]);
  
  if (isLoading) {
    return <ExpenseChartSkeleton />;
  }

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle className="font-headline">Expense Breakdown</CardTitle>
        <CardDescription>{format(date, 'MMMM yyyy')}</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        {expenseData.length > 0 ? (
          <ChartContainer
            config={chartConfig}
            className="mx-auto aspect-square max-h-[300px]"
          >
            <PieChart>
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent hideLabel />}
              />
              <Pie data={expenseData} dataKey="value" nameKey="category" innerRadius={60}>
                {expenseData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
               <ChartLegend content={<ChartLegendContent nameKey="category" />} />
            </PieChart>
          </ChartContainer>
        ) : (
          <div className="flex h-full min-h-[250px] items-center justify-center">
            <p className="text-muted-foreground">No expense data for this month.</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
