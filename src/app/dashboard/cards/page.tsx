
'use client'

import { Card as UICard, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useCollection, useFirestore, useMemoFirebase, useUser } from "@/firebase";
import { Card as CardType, Transaction } from "@/lib/types";
import { collection, query, where } from "firebase/firestore";
import { Pencil, Wifi } from "lucide-react";
import { useMemo, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AddCardSheet } from "@/components/cards/add-card-sheet";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious, type CarouselApi } from "@/components/ui/carousel";
import { cn } from "@/lib/utils";
import { add, format, setDate, isValid } from "date-fns";
import { EmptyState } from "@/components/empty-state";
import { PlusCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

function InvoicesList({ cardId, transactions }: { cardId: string, transactions: Transaction[] | null }) {
    const [carouselApi, setCarouselApi] = useState<CarouselApi>()
    const [selectedInvoice, setSelectedInvoice] = useState<string | null>(null);

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
        // Sort from oldest to newest
        return Object.keys(invoices).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
    }, [invoices]);

    useEffect(() => {
        if (sortedInvoiceMonths.length > 0 && !selectedInvoice) {
            const nextMonth = add(new Date(), { months: 1 });
            const nextMonthString = format(nextMonth, 'MMMM yyyy');
            const defaultSelection = sortedInvoiceMonths.includes(nextMonthString) ? nextMonthString : sortedInvoiceMonths[0];
            setSelectedInvoice(defaultSelection);
        }
        if (carouselApi) {
            const selectedIndex = sortedInvoiceMonths.findIndex(m => m === selectedInvoice);
            if (selectedIndex !== -1 && selectedIndex !== carouselApi.selectedScrollSnap()) {
                carouselApi.scrollTo(selectedIndex);
            }
        }
    }, [sortedInvoiceMonths, selectedInvoice, carouselApi]);

    const handleInvoiceSelect = (month: string) => {
        const index = sortedInvoiceMonths.findIndex(m => m === month);
        if (carouselApi && index !== -1) {
            carouselApi.scrollTo(index);
        }
        setSelectedInvoice(month);
    }
    
    if (sortedInvoiceMonths.length === 0) {
        return <p className="text-muted-foreground text-center p-4">No invoices found for this card.</p>
    }

    const selectedTransactions = selectedInvoice ? invoices[selectedInvoice]?.transactions : [];

    return (
       <div className="flex flex-col gap-4">
         <Carousel setApi={setCarouselApi} className="w-full">
            <CarouselContent>
                {sortedInvoiceMonths.map(month => {
                    const invoice = invoices[month];
                    const isSelected = selectedInvoice === month;
                    return (
                        <CarouselItem key={month} className="basis-1/3 sm:basis-1/4 md:basis-1/5 lg:basis-1/6">
                            <div className="p-1">
                                <UICard 
                                    className={cn("cursor-pointer", isSelected && "border-primary")}
                                    onClick={() => handleInvoiceSelect(month)}
                                >
                                    <CardHeader className="flex flex-row items-center justify-between p-4">
                                        <CardTitle className="text-base">{new Date(month).toLocaleString('default', { month: 'long', year: 'numeric' })}</CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-4 pt-0">
                                        <div className="text-2xl font-bold">{formatCurrency(invoice.total)}</div>
                                    </CardContent>
                                </UICard>
                            </div>
                        </CarouselItem>
                    )
                })}
            </CarouselContent>
            <CarouselPrevious />
            <CarouselNext />
        </Carousel>
        {selectedTransactions && selectedTransactions.length > 0 && (
             <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Installment</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {selectedTransactions.map(t => (
                        <TableRow key={t.id}>
                            <TableCell>{new Date(`${t.date}T00:00:00Z`).toLocaleDateString(undefined, { timeZone: 'UTC' })}</TableCell>
                            <TableCell>{t.description}</TableCell>
                            <TableCell>
                                {t.installments && t.currentInstallment ? `${t.currentInstallment}/${t.installments}` : '-'}
                            </TableCell>
                            <TableCell className="text-right">{formatCurrency(t.amount - (t.deduction || 0))}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        )}
       </div>
    )
}

const CardsSkeleton = () => (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="w-full aspect-[85.6/53.98] rounded-xl" />
        ))}
    </div>
)


export default function CardsPage() {
    const firestore = useFirestore();
    const { user } = useUser();
    const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
    const [editingCard, setEditingCard] = useState<CardType | null>(null);
    const [isSheetOpen, setIsSheetOpen] = useState(false);

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
    
    const handleEditCard = (card: CardType) => {
        setEditingCard(card);
        setIsSheetOpen(true);
    };

    const handleSheetOpenChange = (isOpen: boolean) => {
        setIsSheetOpen(isOpen);
        if (!isOpen) {
            setEditingCard(null);
        }
    }

  return (
    <div className="flex flex-col gap-4">
        <div className="flex items-center">
            <h1 className="text-3xl font-bold tracking-tight font-headline">My Cards</h1>
            <div className="ml-auto flex items-center gap-2">
                <AddCardSheet isOpen={isSheetOpen && !editingCard} onOpenChange={handleSheetOpenChange} />
            </div>
        </div>
        {isLoadingCards ? <CardsSkeleton /> : (
            cards && cards.length > 0 ? (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {cards?.map(card => {
                        const spending = getCardSpending(card.id);
                        const availableLimit = card.limit - spending;
                        const isSelected = selectedCardId === card.id;

                        return (
                            <div key={card.id}>
                                <div 
                                    className="w-full aspect-[85.6/53.98] rounded-xl p-4 flex flex-col justify-between text-white shadow-lg cursor-pointer transition-all duration-300 relative group" 
                                    style={{ backgroundColor: card.color, transform: isSelected ? 'scale(1.05)' : 'scale(1)', zIndex: isSelected ? 10 : 1 }}
                                    onClick={() => toggleCardSelection(card.id)}
                                >
                                    <header className="flex justify-between items-start">
                                        <span className="text-lg font-semibold tracking-wider">{card.cardName}</span>
                                    </header>
                                    
                                    <div className="flex items-center gap-3">
                                        <div>
                                            <p className="text-xs opacity-80">Available Limit</p>
                                            <p className="text-xl font-bold tracking-tight">{formatCurrency(availableLimit)}</p>
                                        </div>
                                    </div>
                                    <AddCardSheet isOpen={isSheetOpen && editingCard?.id === card.id} onOpenChange={handleSheetOpenChange} editingCard={editingCard}>
                                        <Button
                                        variant="ghost"
                                        size="icon"
                                        className="absolute top-2 right-2 h-7 w-7 text-white"
                                        onClick={(e) => { e.stopPropagation(); handleEditCard(card); }}
                                        >
                                        <Pencil size={16} />
                                        </Button>
                                    </AddCardSheet>

                                    <footer className="flex justify-between items-end text-xs">
                                        <span>Due: {card.dueDate ?? 'N/A'}</span>
                                        <span className="font-mono tracking-widest opacity-80">•••• {card.last4}</span>
                                    </footer>
                                </div>
                            </div>
                        )
                    })}
                </div>
            ) : (
                <EmptyState
                    icon={PlusCircle}
                    title="No cards added yet"
                    description="Get started by adding your first credit or debit card to manage your finances."
                >
                    <AddCardSheet />
                </EmptyState>
            )
        )}
        
        {selectedCardId && (
            <UICard>
                <CardHeader>
                    <CardTitle>Invoices for {cards?.find(c => c.id === selectedCardId)?.cardName}</CardTitle>
                    <CardDescription>Select an invoice to see its transactions.</CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoadingTransactions ? <p>Loading invoices...</p> : <InvoicesList cardId={selectedCardId} transactions={allTransactions} />}
                </CardContent>
            </UICard>
        )}
    </div>
  );
}
