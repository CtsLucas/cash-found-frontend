
'use client'

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useCollection, useFirestore, useUser, useMemoFirebase } from "@/firebase";
import { Card as CardType, Transaction } from "@/lib/types";
import { collection, query, where } from "firebase/firestore";
import { PlusCircle, Wifi, Nfc } from "lucide-react";
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
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {cards?.map(card => {
                const spending = getCardSpending(card.id);
                const availableLimit = card.limit - spending;

                return (
                    <div key={card.id} className="aspect-[85.6/53.98] rounded-xl p-6 flex flex-col justify-between text-white shadow-lg" style={{ backgroundColor: card.color }}>
                        <header className="flex justify-between items-start">
                            <span className="text-xl font-semibold tracking-wider">{card.cardName}</span>
                            <Wifi size={24} className="opacity-80"/>
                        </header>
                        
                        <div className="flex items-center gap-4">
                            <Nfc size={36} className="text-yellow-400 opacity-90" />
                            <div>
                                <p className="text-sm opacity-80">Available Limit</p>
                                <p className="text-2xl font-bold tracking-tight">{formatCurrency(availableLimit)}</p>
                            </div>
                        </div>

                        <footer className="flex justify-between items-end text-sm">
                            <span>Due: {new Date(card.dueDate).toLocaleDateString(undefined, { month: '2-digit', day: '2-digit' })}</span>
                            <span className="font-mono tracking-widest opacity-80">•••• {card.last4}</span>
                        </footer>
                    </div>
                )
            })}
        </div>
    </div>
  );
}
