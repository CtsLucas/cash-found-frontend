
'use client'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useCollection, useFirestore, useUser, useMemoFirebase } from "@/firebase";
import { Transaction } from "@/lib/types";
import { collection, limit, orderBy, query } from "firebase/firestore";

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

export function RecentTransactions() {
  const firestore = useFirestore();
  const { user } = useUser();

  const recentTransactionsQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(collection(firestore, `users/${user.uid}/transactions`), orderBy('date', 'desc'), limit(5));
  }, [firestore, user]);

  const { data: recentTransactions, isLoading } = useCollection<Transaction>(recentTransactionsQuery);


  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">Recent Transactions</CardTitle>
        <CardDescription>A quick look at your latest activity.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Description</TableHead>
              <TableHead className="hidden sm:table-cell">Type</TableHead>
              <TableHead className="text-right">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && <TableRow><TableCell colSpan={3} className="text-center">Loading...</TableCell></TableRow>}
            {!isLoading && recentTransactions?.length === 0 && <TableRow><TableCell colSpan={3} className="text-center">No recent transactions.</TableCell></TableRow>}
            {recentTransactions?.map((transaction) => {
              const amount = transaction.type === 'expense' 
                ? transaction.amount - (transaction.deduction || 0)
                : transaction.amount;

              return (
              <TableRow key={transaction.id}>
                <TableCell>
                  <div className="font-medium">{transaction.description}</div>
                  <div className="hidden text-sm text-muted-foreground md:inline">
                    {transaction.category}
                  </div>
                </TableCell>
                <TableCell className="hidden sm:table-cell capitalize">{transaction.type}</TableCell>
                <TableCell className={`text-right ${transaction.type === 'income' ? 'text-green-500' : 'text-red-500'}`}>
                  {transaction.type === 'income' ? '+' : '-'}{formatCurrency(amount)}
                </TableCell>
              </TableRow>
            )})}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
