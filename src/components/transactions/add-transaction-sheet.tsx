
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
import { PlusCircle } from "lucide-react";
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
import { addDocumentNonBlocking, setDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { collection, doc, writeBatch } from "firebase/firestore";
import { Category, Transaction, Tag, Card } from "@/lib/types";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { add, format } from "date-fns";
import { CurrencyInput } from "../ui/currency-input";
import { Label } from "@/components/ui/label";
  
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
    installments: z.coerce.number().min(1).optional(),
    currentInstallment: z.coerce.number().optional(),
    groupId: z.string().optional(),
    userId: z.string()
});

type TransactionFormValues = z.infer<typeof transactionSchema>;

const getInvoiceMonths = () => {
    const months = [];
    const today = new Date();
    for (let i = 0; i < 13; i++) { // Current month + next 12 months
        const date = add(today, { months: i });
        months.push(format(date, 'MMMM yyyy'));
    }
    return months;
}

interface AddTransactionSheetProps {
    children?: React.ReactNode;
    isOpen?: boolean;
    onOpenChange?: (isOpen: boolean) => void;
    editingTransaction?: Transaction | null;
}

export function AddTransactionSheet({ isOpen: controlledIsOpen, onOpenChange: setControlledIsOpen, editingTransaction, children }: AddTransactionSheetProps) {
  const firestore = useFirestore();
  const { user } = useUser();

  const [isInternalOpen, setInternalOpen] = React.useState(false);

  const isOpen = controlledIsOpen ?? isInternalOpen;
  const setIsOpen = setControlledIsOpen ?? setInternalOpen;
  const [openTags, setOpenTags] = React.useState(false);

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

  const invoiceMonths = React.useMemo(() => getInvoiceMonths(), []);
  const currentMonth = format(new Date(), 'MMMM yyyy');

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
      cardId: "",
      invoiceMonth: currentMonth,
      installments: 1,
      userId: user?.uid
    },
  });

  const type = form.watch("type");
  const amount = form.watch("amount");
  const deduction = form.watch("deduction");
  const cardId = form.watch("cardId");
  const isCardExpense = type === 'expense' && cardId && cardId !== 'none';

  const calculatedAmount = type === 'expense' ? (Number(amount) || 0) - (Number(deduction) || 0) : (Number(amount) || 0);

  React.useEffect(() => {
    if (user) {
        const defaultValues = {
            type: "expense" as const,
            amount: 0,
            deduction: 0,
            description: "",
            category: "",
            date: new Date().toISOString().split("T")[0],
            tags: [] as string[],
            cardId: "",
            invoiceMonth: currentMonth,
            installments: 1,
            userId: user.uid
        };

        if (editingTransaction) {
            // The date from firestore is already in 'YYYY-MM-DD' format,
            // which is exactly what the <input type="date"> needs. No conversion necessary.
            form.reset({
              ...editingTransaction,
              date: editingTransaction.date || '',
              tags: editingTransaction.tags || [],
              cardId: editingTransaction.cardId || "",
              invoiceMonth: editingTransaction.invoiceMonth || currentMonth,
              installments: editingTransaction.installments || 1,
            });
        } else {
            form.reset(defaultValues);
        }
    }
  }, [user, isOpen, editingTransaction, currentMonth, form]);

  const onSubmit = async (data: TransactionFormValues) => {
    if (!user || !firestore) return;
  
    const dataToSave: Partial<Transaction> = { ...data };
    if (data.type === 'income') {
      delete dataToSave.cardId;
      delete dataToSave.invoiceMonth;
      delete dataToSave.deduction;
      delete dataToSave.installments;
    }
  
    if (data.cardId === 'none') {
      dataToSave.cardId = '';
    }

    const installmentCount = data.installments || 1;
    
    if (isEditing) {
        if(editingTransaction?.id) {
            const transactionRef = doc(firestore, `users/${user.uid}/transactions/${editingTransaction.id}`);
            // Note: Editing installments is not supported in this flow.
            // We just update the main transaction.
            setDocumentNonBlocking(transactionRef, dataToSave, { merge: true });
        }
    } else if (isCardExpense && installmentCount > 1) {
        const batch = writeBatch(firestore);
        const transactionsCollection = collection(firestore, `users/${user.uid}/transactions`);
        
        const installmentAmount = calculatedAmount / installmentCount;
        const startingInvoiceDate = data.invoiceMonth ? new Date(data.invoiceMonth) : new Date();
        // The date string from the form is 'YYYY-MM-DD'.
        // Create a date object from it, ensuring it's treated as local time
        // by splitting and re-assembling to avoid UTC conversion issues.
        const dateParts = data.date.split('-').map(p => parseInt(p, 10));
        const originalTransactionDate = new Date(dateParts[0], dateParts[1] - 1, dateParts[2]);

        const groupId = doc(collection(firestore, 'some_path')).id; // Temporary ref to get a new ID

        for (let i = 0; i < installmentCount; i++) {
            const newTransactionRef = doc(transactionsCollection);

            const installmentDate = add(originalTransactionDate, { months: i });
            const invoiceDate = add(startingInvoiceDate, { months: i });

            const installmentTransaction = {
                ...dataToSave,
                id: newTransactionRef.id,
                amount: installmentAmount,
                deduction: 0, // Deduction is applied once to the total amount before splitting
                description: data.description,
                date: format(installmentDate, 'yyyy-MM-dd'),
                invoiceMonth: format(invoiceDate, 'MMMM yyyy'),
                installments: installmentCount,
                currentInstallment: i + 1,
                groupId,
            };
            batch.set(newTransactionRef, installmentTransaction);
        }
        await batch.commit();

    } else {
      // Create a single new transaction
      const transactionsCollection = collection(firestore, `users/${user.uid}/transactions`);
      addDocumentNonBlocking(transactionsCollection, dataToSave);
    }
    
    setIsOpen(false);
  };

  const isEditing = !!editingTransaction;

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
        {children ? (
            <SheetTrigger asChild>{children}</SheetTrigger>
        ) : (
            <SheetTrigger asChild>
                <Button size="sm" className="h-8 gap-1">
                <PlusCircle className="h-3.5 w-3.5" />
                <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                    Add Transaction
                </span>
                </Button>
            </SheetTrigger>
        )}
      <SheetContent className="sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>{isEditing ? 'Edit transaction' : 'Add a new transaction'}</SheetTitle>
          <SheetDescription>
            {isEditing ? 'Update the details of your financial record.' : 'Fill in the details below to add a new financial record.'}
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
                                    value={field.value}
                                    className="grid grid-cols-2 gap-2"
                                >
                                    <FormItem>
                                        <Label className="cursor-pointer">
                                            <FormControl>
                                                <RadioGroupItem value="expense" id="r1" className="sr-only" />
                                            </FormControl>
                                            <div
                                                className={cn(
                                                    "flex items-center justify-center rounded-md border-2 border-muted bg-popover p-4",
                                                    "hover:bg-red-500/10 hover:border-red-500/20",
                                                    field.value === 'expense' && "bg-red-500 text-white border-red-500 hover:bg-red-500/90"
                                                )}
                                            >
                                                Expense
                                            </div>
                                        </Label>
                                    </FormItem>
                                    <FormItem>
                                         <Label className="cursor-pointer">
                                            <FormControl>
                                                <RadioGroupItem value="income" id="r2" className="sr-only" />
                                            </FormControl>
                                            <div
                                                className={cn(
                                                    "flex items-center justify-center rounded-md border-2 border-muted bg-popover p-4",
                                                    "hover:bg-green-500/10 hover:border-green-500/20",
                                                    field.value === 'income' && "bg-green-500 text-white border-green-500 hover:bg-green-500/90"
                                                )}
                                            >
                                                Income
                                            </div>
                                        </Label>
                                    </FormItem>
                                </RadioGroup>
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className={cn("grid gap-4", type === 'expense' ? 'grid-cols-2' : 'grid-cols-1')}>
                    <FormField
                        control={form.control}
                        name="amount"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Amount</FormLabel>
                                <FormControl>
                                    <CurrencyInput 
                                        placeholder="$0.00"
                                        value={field.value}
                                        onValueChange={field.onChange}
                                    />
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
                                    <CurrencyInput 
                                        placeholder="$0.00"
                                        value={field.value}
                                        onValueChange={field.onChange}
                                    />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    )}
                </div>
                
                {type === 'expense' && (
                    <FormItem>
                        <FormLabel>Final Amount</FormLabel>
                        <FormControl>
                            <CurrencyInput 
                                value={calculatedAmount}
                                disabled 
                                className={cn(type === 'expense' ? "text-destructive" : "text-green-500", "font-bold")}
                            />
                        </FormControl>
                    </FormItem>
                )}
                
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
                            <Select onValueChange={field.onChange} value={field.value}>
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
                            <Popover open={openTags} onOpenChange={setOpenTags}>
                                <PopoverTrigger asChild>
                                    <FormControl>
                                        <Button
                                            variant="outline"
                                            role="combobox"
                                            className={cn(
                                                "w-full justify-between h-auto",
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
                                                        value={tag.id}
                                                        onSelect={(currentValue) => {
                                                            const selectedTags = field.value || [];
                                                            const isSelected = selectedTags.includes(currentValue);
                                                            if (isSelected) {
                                                                field.onChange(selectedTags.filter(id => id !== currentValue));
                                                            } else {
                                                                field.onChange([...selectedTags, currentValue]);
                                                            }
                                                            setOpenTags(true);
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
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select a card" />
                                        </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="none">None</SelectItem>
                                            {cards?.map(card => <SelectItem key={card.id} value={card.id}>{card.cardName} - {card.last4}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                         {isCardExpense && !isEditing && (
                            <FormField
                                control={form.control}
                                name="installments"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Installments</FormLabel>
                                        <FormControl>
                                            <Input type="number" min="1" placeholder="1" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        )}
                        {isCardExpense && (
                            <FormField
                                control={form.control}
                                name="invoiceMonth"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Invoice Month</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}>
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
                        )}
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
