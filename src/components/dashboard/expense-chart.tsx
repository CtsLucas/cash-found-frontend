"use client"

import { Pie, PieChart, Cell } from "recharts"

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
import { expenseData } from "@/lib/data"

const chartConfig = {
    value: {
        label: "Value",
    },
    ...expenseData.reduce((acc, item) => {
        acc[item.category] = {
            label: item.category,
            color: item.fill,
        };
        return acc;
    }, {} as any),
};

export function ExpenseChart() {
  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle className="font-headline">Expense Breakdown</CardTitle>
        <CardDescription>July 2024</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
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
      </CardContent>
    </Card>
  )
}
