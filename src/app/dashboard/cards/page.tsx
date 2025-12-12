
'use client'

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useCollection, useFirestore, useUser, useMemoFirebase } from "@/firebase";
import { Card as CardType, Transaction } from "@/lib/types";
import { collection, query, where } from "firebase/firestore";
import { PlusCircle } from "lucide-react";
import { useMemo } from "react";
import { AddCardSheet } from "@/components/cards/add-card-sheet";

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

function CardSpending({ cardId }: { cardId: string }) {
    const firestore = useFirestore();
    const { user } = useUser();
    const transactionsQuery = useMemoFirebase(() => {
        if (!user) return null;
        return query(
            collection(firestore, `users/${user.uid}/transactions`),
            where('cardId', '==', cardId),
            where('type', '==', 'expense')
        );
    }, [firestore, user, cardId]);
    const { data: transactions } = useCollection<Transaction>(transactionsQuery);

    const totalSpending = useMemo(() => {
        return transactions?.reduce((acc, t) => acc + t.amount - (t.deduction || 0), 0) ?? 0;
    }, [transactions]);

    return {
        totalSpending,
        transactions
    };
}


export default function CardsPage() {
    const firestore = useFirestore();
    const { user } = useUser();

    const cardsQuery = useMemoFirebase(() => {
        if (!user) return null;
        return collection(firestore, `users/${user.uid}/cards`);
    }, [firestore, user]);

    const { data: cards, isLoading: isLoadingCards } = useCollection<CardType>(cardsQuery);
    
    // We need all transactions to calculate spending per card
    const allTransactionsQuery = useMemoFirebase(() => {
        if (!user) return null;
        return query(collection(firestore, `users/${user.uid}/transactions`), where('type', '==', 'expense'));
    }, [firestore, user]);

    const { data: allTransactions, isLoading: isLoadingTransactions } = useCollection<Transaction>(allTransactionsQuery);

    const getCardSpending = (cardId: string) => {
        if (!allTransactions) return 0;
        return allTransactions
            .filter(t => t.cardId === cardId)
            .reduce((acc, t) => acc + t.amount - (t.deduction || 0), 0);
    }

  return (
    <div className="flex flex-col gap-4">
        <div className="flex items-center">
            <h1 className="text-3xl font-bold tracking-tight font-headline">My Cards</h1>
            <div className="ml-auto flex items-center gap-2">
                <AddCardSheet />
            </div>
        </div>
        {isLoadingCards && <p>Loading cards...</p>}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {cards?.map(card => {
                const spending = getCardSpending(card.id);
                const availableLimit = card.limit - spending;
                const usagePercentage = card.limit > 0 ? (spending / card.limit) * 100 : 0;

                return (
                    <Card key={card.id} style={{ borderTopColor: card.color, borderTopWidth: '4px' }}>
                        <CardHeader className="pb-2">
                            <CardDescription>{card.cardName}</CardDescription>
                            <CardTitle className="text-4xl">{formatCurrency(availableLimit)}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-xs text-muted-foreground">
                                {formatCurrency(spending)} of {formatCurrency(card.limit)} used
                            </div>
                            <Progress value={usagePercentage} aria-label={`${usagePercentage.toFixed(0)}% used`} className="mt-2" />
                        </CardContent>
                        <CardFooter className="flex justify-between text-sm text-muted-foreground">
                            <span>Due: {new Date(card.dueDate).toLocaleDateString()}</span>
                        </CardFooter>
                    </Card>
                )
            })}
        </div>
    </div>
  );
}
