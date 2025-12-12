
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
import { useCollection, useFirestore, useUser, useMemoFirebase } from "@/firebase";
import { Transaction, Card as CardType } from "@/lib/types";
import { collection } from "firebase/firestore";
import { Skeleton } from "../ui/skeleton";
import { useMemo } from "react";
import { format } from "date-fns";

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
};

const MonthlyDebitsSkeleton = () => {
    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-center">Date / Vencimento</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {Array.from({ length: 3 }).map((_, index) => (
                    <TableRow key={index}>
                        <TableCell>
                            <Skeleton className="h-5 w-32" />
                        </TableCell>
                        <TableCell className="text-center">
                            <Skeleton className="h-5 w-24 mx-auto" />
                        </TableCell>
                        <TableCell className="text-right">
                            <Skeleton className="h-5 w-20 ml-auto" />
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
};


interface MonthlyDebitsProps {
    transactions: Transaction[] | null;
    isLoading: boolean;
}

export function MonthlyDebits({ transactions, isLoading }: MonthlyDebitsProps) {
  const firestore = useFirestore();
  const { user } = useUser();
  
  const cardsQuery = useMemoFirebase(() => {
    if (!user) return null;
    return collection(firestore, `users/${user.uid}/cards`);
  }, [firestore, user]);
  const { data: cards, isLoading: isLoadingCards } = useCollection<CardType>(cardsQuery);

  const { directDebits, cardInvoices } = useMemo(() => {
    if (!transactions || !cards) {
        return { directDebits: [], cardInvoices: [] };
    }

    const expenseTransactions = transactions.filter(t => t.type === 'expense');

    const directDebits = expenseTransactions.filter(t => !t.cardId);

    const cardInvoices = expenseTransactions
        .filter(t => t.cardId)
        .reduce((acc, t) => {
            if (!acc[t.cardId!]) {
                const card = cards.find(c => c.id === t.cardId);
                acc[t.cardId!] = {
                    cardName: card?.cardName || 'Unknown Card',
                    dueDate: card?.dueDate ? new Date(`${card.dueDate}T00:00:00Z`) : null,
                    total: 0,
                };
            }
            acc[t.cardId!].total += t.amount - (t.deduction || 0);
            return acc;
        }, {} as Record<string, { cardName: string, dueDate: Date | null, total: number }>);
    
    return { directDebits, cardInvoices: Object.values(cardInvoices) };

  }, [transactions, cards]);

  const allDebits = [...directDebits.map(d => ({...d, isInvoice: false})), ...cardInvoices.map(i => ({...i, isInvoice: true}))];


  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">Monthly Debits</CardTitle>
        <CardDescription>A summary of your expenses for the month, including credit card invoices.</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading || isLoadingCards ? <MonthlyDebitsSkeleton /> : (
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Description</TableHead>
                        <TableHead className="text-center">Date / Vencimento</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {!isLoading && allDebits.length === 0 && <TableRow><TableCell colSpan={3} className="text-center">No debits for this month.</TableCell></TableRow>}
                    
                    {directDebits.map((debit) => (
                        <TableRow key={debit.id}>
                            <TableCell>{debit.description}</TableCell>
                            <TableCell className="text-center">
                                {new Date(`${debit.date}T00:00:00Z`).toLocaleDateString(undefined, { timeZone: 'UTC' })}
                            </TableCell>
                            <TableCell className="text-right text-destructive">
                                -{formatCurrency(debit.amount - (debit.deduction || 0))}
                            </TableCell>
                        </TableRow>
                    ))}
                    
                    {cardInvoices.map((invoice, index) => (
                        <TableRow key={`invoice-${index}`}>
                             <TableCell className="font-medium">Invoice for {invoice.cardName}</TableCell>
                             <TableCell className="text-center">
                                {invoice.dueDate ? invoice.dueDate.toLocaleDateString(undefined, { month: '2-digit', day: '2-digit', timeZone: 'UTC' }) : 'N/A'}
                             </TableCell>
                             <TableCell className="text-right text-destructive font-bold">
                                -{formatCurrency(invoice.total)}
                             </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        )}
      </CardContent>
    </Card>
  );
}
