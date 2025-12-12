import { OverviewCards } from "@/components/dashboard/overview-cards";
import { ExpenseChart } from "@/components/dashboard/expense-chart";
import { RecentTransactions } from "@/components/dashboard/recent-transactions";

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-3xl font-bold tracking-tight font-headline">Dashboard</h1>
      <OverviewCards />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <div className="lg:col-span-4">
          <RecentTransactions />
        </div>
        <div className="lg:col-span-3">
          <ExpenseChart />
        </div>
      </div>
    </div>
  );
}
