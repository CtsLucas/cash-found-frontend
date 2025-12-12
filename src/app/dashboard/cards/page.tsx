
'use client'

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { AddCardSheet } from "@/components/cards/add-card-sheet";
import { Badge } from "@/components/ui/badge";
import { Card as UICard, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useCollection, useFirestore, useMemoFirebase, useUser } from "@/firebase";
import { Card as CardType, Transaction } from "@/lib/types";
import { collection, query, where } from "firebase/firestore";
import { Wifi, Nfc, ChevronDown } from "lucide-react";
import { useMemo, useState } from "react";

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

function InvoicesList({ cardId, transactions }: { cardId: string, transactions: Transaction[] | null }) {
    const invoices = useMemo(() => {
        if (!transactions) return {};
        return transactions
            .filter(t => t.cardId === cardId && t.invoiceMonth)
            .reduce((acc, t) => {
                const month = t.invoiceMonth!;
                if (!acc[month]) {
                    acc[month] = {
                        transactions: [],
                        total: 0,
                    };
                }
                const amount = t.amount - (t.deduction || 0);
                acc[month].transactions.push(t);
                acc[month].total += amount;
                return acc;
            }, {} as Record<string, { transactions: Transaction[], total: number }>);
    }, [transactions, cardId]);

    const sortedInvoiceMonths = useMemo(() => {
        return Object.keys(invoices).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
    }, [invoices]);

    if (sortedInvoiceMonths.length === 0) {
        return <p className="text-muted-foreground text-center p-4">No invoices found for this card.</p>
    }

    return (
        <Accordion type="single" collapsible className="w-full">
            {sortedInvoiceMonths.map(month => {
                const invoice = invoices[month];
                return (
                    <AccordionItem value={month} key={month}>
                        <AccordionTrigger>
                            <div className="flex justify-between w-full pr-4">
                                <span>{month}</span>
                                <span className="text-right font-medium">{formatCurrency(invoice.total)}</span>
                            </div>
                        </AccordionTrigger>
                        <AccordionContent>
                           <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Description</TableHead>
                                    <TableHead className="text-right">Amount</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {invoice.transactions.map(t => (
                                    <TableRow key={t.id}>
                                        <TableCell>{new Date(t.date).toLocaleDateString()}</TableCell>
                                        <TableCell>{t.description}</TableCell>
                                        <TableCell className="text-right">{formatCurrency(t.amount - (t.deduction || 0))}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                           </Table>
                        </AccordionContent>
                    </AccordionItem>
                )
            })}
        </Accordion>
    )
}


export default function CardsPage() {
    const firestore = useFirestore();
    const { user } = useUser();
    const [selectedCardId, setSelectedCardId] = useState<string | null>(null);

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

    const toggleCardSelection = (cardId: string) => {
        if (selectedCardId === cardId) {
            setSelectedCardId(null);
        } else {
            setSelectedCardId(cardId);
        }
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
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {cards?.map(card => {
                const spending = getCardSpending(card.id);
                const availableLimit = card.limit - spending;
                const isSelected = selectedCardId === card.id;

                return (
                    <div key={card.id}>
                        <div 
                            className="w-full aspect-[85.6/53.98] rounded-xl p-4 flex flex-col justify-between text-white shadow-lg cursor-pointer transition-all duration-300" 
                            style={{ backgroundColor: card.color, transform: isSelected ? 'scale(1.05)' : 'scale(1)', zIndex: isSelected ? 10 : 1 }}
                            onClick={() => toggleCardSelection(card.id)}
                        >
                            <header className="flex justify-between items-start">
                                <span className="text-lg font-semibold tracking-wider">{card.cardName}</span>
                                <Wifi size={20} className="opacity-80"/>
                            </header>
                            
                            <div className="flex items-center gap-3">
                                <Nfc size={28} className="text-yellow-400 opacity-90" />
                                <div>
                                    <p className="text-xs opacity-80">Available Limit</p>
                                    <p className="text-xl font-bold tracking-tight">{formatCurrency(availableLimit)}</p>
                                </div>
                            </div>

                            <footer className="flex justify-between items-end text-xs">
                                <span>Due: {new Date(card.dueDate).toLocaleDateString(undefined, { month: '2-digit', day: '2-digit' })}</span>
                                <span className="font-mono tracking-widest opacity-80">•••• {card.last4}</span>
                            </footer>
                        </div>
                    </div>
                )
            })}
        </div>
        {selectedCardId && (
            <UICard>
                <CardHeader>
                    <CardTitle>Invoices for {cards?.find(c => c.id === selectedCardId)?.cardName}</CardTitle>
                    <CardDescription>Click on an invoice to see its transactions.</CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoadingTransactions ? <p>Loading invoices...</p> : <InvoicesList cardId={selectedCardId} transactions={allTransactions} />}
                </CardContent>
            </UICard>
        )}
    </div>
  );
}
