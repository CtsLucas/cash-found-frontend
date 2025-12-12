
"use client"

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
  SheetClose
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PlusCircle, X } from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
  } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useFirestore, useUser, useCollection, useMemoFirebase } from "@/firebase";
import { addDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { collection } from "firebase/firestore";
import { Category, Transaction, Tag, Card } from "@/lib/types";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
  
const transactionSchema = z.object({
    type: z.enum(["expense", "income"]),
    amount: z.coerce.number().positive("Amount must be positive"),
    deduction: z.coerce.number().optional(),
    description: z.string().min(1, "Description is required."),
    category: z.string().min(1, "Category is required."),
    date: z.string().min(1, "Date is required."),
    tags: z.array(z.string()).optional(),
    cardId: z.string().optional(),
    invoiceMonth: z.string().optional(),
    userId: z.string()
});

type TransactionFormValues = z.infer<typeof transactionSchema>;

const getInvoiceMonths = () => {
    const months = [];
    const today = new Date();
    for (let i = 0; i < 12; i++) {
        const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
        months.push(date.toLocaleString('default', { month: 'long', year: 'numeric' }));
    }
    return months;
}

export function AddTransactionSheet() {
  const firestore = useFirestore();
  const { user } = useUser();
  const [isOpen, setIsOpen] = React.useState(false);

  const categoriesQuery = useMemoFirebase(() => {
    if (!user) return null;
    return collection(firestore, `users/${user.uid}/categories`);
  }, [firestore, user]);
  const { data: categories } = useCollection<Category>(categoriesQuery);
  
  const tagsQuery = useMemoFirebase(() => {
    if (!user) return null;
    return collection(firestore, `users/${user.uid}/tags`);
  }, [firestore, user]);
  const { data: tags } = useCollection<Tag>(tagsQuery);
  
  const cardsQuery = useMemoFirebase(() => {
    if (!user) return null;
    return collection(firestore, `users/${user.uid}/cards`);
  }, [firestore, user]);
  const { data: cards } = useCollection<Card>(cardsQuery);

  const form = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      type: "expense",
      amount: 0,
      deduction: 0,
      description: "",
      category: "",
      date: new Date().toISOString().split("T")[0],
      tags: [],
      userId: user?.uid
    },
  });

  const type = form.watch("type");
  const amount = form.watch("amount");
  const deduction = form.watch("deduction");

  const calculatedAmount = type === 'expense' ? (Number(amount) || 0) - (Number(deduction) || 0) : (Number(amount) || 0);

  React.useEffect(() => {
    if (user) {
        form.reset({
            type: "expense",
            amount: 0,
            deduction: 0,
            description: "",
            category: "",
            date: new Date().toISOString().split("T")[0],
            tags: [],
            userId: user.uid
        });
    }
  }, [user, form, isOpen]);

  const onSubmit = (data: TransactionFormValues) => {
    if (!user) return;
    const transactionsCollection = collection(firestore, `users/${user.uid}/transactions`);
    const dataToSave = { ...data };
    if(data.type === 'income') {
      delete dataToSave.cardId;
      delete dataToSave.invoiceMonth;
    }
    addDocumentNonBlocking(transactionsCollection, dataToSave);
    setIsOpen(false);
    form.reset();
  };

  const invoiceMonths = getInvoiceMonths();

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button size="sm" className="h-8 gap-1">
          <PlusCircle className="h-3.5 w-3.5" />
          <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
            Add Transaction
          </span>
        </Button>
      </SheetTrigger>
      <SheetContent className="sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>Add a new transaction</SheetTitle>
          <SheetDescription>
            Fill in the details below to add a new financial record.
          </SheetDescription>
        </SheetHeader>
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 py-4">
                <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                        <FormItem>
                            <FormControl>
                                <RadioGroup 
                                    onValueChange={field.onChange} 
                                    defaultValue={field.value} 
                                    className="grid grid-cols-2 gap-2"
                                >
                                    <FormItem>
                                        <RadioGroupItem value="expense" id="r1" className="sr-only" />
                                        <FormLabel htmlFor="r1">
                                            <div className={cn(
                                                "flex items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground",
                                                field.value === 'expense' && "border-primary"
                                            )}>
                                                Expense
                                            </div>
                                        </FormLabel>
                                    </FormItem>
                                    <FormItem>
                                        <RadioGroupItem value="income" id="r2" className="sr-only" />
                                        <FormLabel htmlFor="r2">
                                            <div className={cn(
                                                "flex items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground",
                                                field.value === 'income' && "border-primary"
                                            )}>
                                                Income
                                            </div>
                                        </FormLabel>
                                    </FormItem>
                                </RadioGroup>
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="grid grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="amount"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Amount</FormLabel>
                                <FormControl>
                                    <Input type="number" placeholder="$0.00" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    {type === 'expense' && (
                        <FormField
                            control={form.control}
                            name="deduction"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Deduction</FormLabel>
                                    <FormControl>
                                        <Input type="number" placeholder="$0.00" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    )}
                </div>
                
                <div className="text-right text-lg font-bold">
                    Final Amount: ${Number(calculatedAmount).toFixed(2)}
                </div>
                
                <Separator />
                
                <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Description</FormLabel>
                            <FormControl>
                                <Input placeholder="e.g. Groceries" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                 <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Category</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a category" />
                                </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {categories?.map(cat => <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="tags"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Tags</FormLabel>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <FormControl>
                                        <Button
                                            variant="outline"
                                            role="combobox"
                                            className={cn(
                                                "w-full justify-between",
                                                !field.value?.length && "text-muted-foreground"
                                            )}
                                        >
                                            <div className="flex gap-1 flex-wrap">
                                                {field.value?.map((tagId) => {
                                                    const tag = tags?.find(t => t.id === tagId);
                                                    return <Badge variant="secondary" key={tagId}>{tag?.name}</Badge>
                                                })}
                                                {field.value?.length === 0 && "Select tags"}
                                            </div>
                                        </Button>
                                    </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                                    <Command>
                                        <CommandInput placeholder="Search tags..." />
                                        <CommandList>
                                            <CommandEmpty>No tags found.</CommandEmpty>
                                            <CommandGroup>
                                                {tags?.map((tag) => (
                                                    <CommandItem
                                                        key={tag.id}
                                                        onSelect={() => {
                                                            const currentValue = field.value || [];
                                                            if (currentValue.includes(tag.id)) {
                                                                field.onChange(currentValue.filter(id => id !== tag.id));
                                                            } else {
                                                                field.onChange([...currentValue, tag.id]);
                                                            }
                                                        }}
                                                    >
                                                        {tag.name}
                                                    </CommandItem>
                                                ))}
                                            </CommandGroup>
                                        </CommandList>
                                    </Command>
                                </PopoverContent>
                            </Popover>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="date"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Date</FormLabel>
                            <FormControl>
                                <Input type="date" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {type === 'expense' && (
                    <>
                        <FormField
                            control={form.control}
                            name="cardId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Card</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select a card" />
                                        </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {cards?.map(card => <SelectItem key={card.id} value={card.id}>{card.cardName} - {card.last4}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="invoiceMonth"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Invoice Month</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select an invoice month" />
                                        </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {invoiceMonths.map(month => <SelectItem key={month} value={month}>{month}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </>
                )}
                
                <SheetFooter className="pt-4">
                    <SheetClose asChild>
                        <Button variant="outline">Cancel</Button>
                    </SheetClose>
                    <Button type="submit">Save transaction</Button>
                </SheetFooter>
            </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}

    