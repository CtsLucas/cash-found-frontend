import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cards, transactions } from "@/lib/data";
import { PlusCircle } from "lucide-react";

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

export default function CardsPage() {

    const getCardSpending = (cardId: string) => {
        // This is a mock calculation. In a real app, you'd filter transactions by cardId and date range.
        return transactions
            .filter(t => t.type === 'expense')
            .reduce((acc, t) => acc + t.amount, 0) / cards.length;
    }

  return (
    <div className="flex flex-col gap-4">
        <div className="flex items-center">
            <h1 className="text-3xl font-bold tracking-tight font-headline">My Cards</h1>
            <div className="ml-auto flex items-center gap-2">
                <Button size="sm" className="h-8 gap-1">
                    <PlusCircle className="h-3.5 w-3.5" />
                    <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                        Add Card
                    </span>
                </Button>
            </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {cards.map(card => {
                const spending = getCardSpending(card.id);
                const availableLimit = card.limit - spending;
                const usagePercentage = (spending / card.limit) * 100;

                return (
                    <Card key={card.id}>
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
                            <span>Closes: {new Date(card.closingDate).toLocaleDateString()}</span>
                        </CardFooter>
                    </Card>
                )
            })}
        </div>
    </div>
  );
}
