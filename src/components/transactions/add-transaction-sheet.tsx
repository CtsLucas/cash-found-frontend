

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
import { add } from "date-fns";
  
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

  const invoiceMonths = getInvoiceMonths();

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
      invoiceMonth: invoiceMonths[0],
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
            invoiceMonth: invoiceMonths[0],
            installments: 1,
            userId: user.uid
        };

        if (editingTransaction) {
            form.reset({
              ...editingTransaction,
              date: editingTransaction.date ? new Date(editingTransaction.date).toISOString().split('T')[0] : '',
              tags: editingTransaction.tags || [],
              cardId: editingTransaction.cardId || "",
              invoiceMonth: editingTransaction.invoiceMonth || invoiceMonths[0],
              installments: editingTransaction.installments || 1,
            });
        } else {
            form.reset(defaultValues);
        }
    }
  }, [user, form, isOpen, editingTransaction, invoiceMonths]);

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

    if (isEditing) {
        if(editingTransaction?.id) {
            const transactionRef = doc(firestore, `users/${user.uid}/transactions/${editingTransaction.id}`);
            // Note: Editing installments is not supported in this flow.
            // We just update the main transaction.
            setDocumentNonBlocking(transactionRef, dataToSave, { merge: true });
        }
    } else {
      // Create new transaction
      const transactionsCollection = collection(firestore, `users/${user.uid}/transactions`);
      const newTransactionRef = doc(transactionsCollection); // Create a new doc ref to get the ID
      
      await addDocumentNonBlocking(transactionsCollection, { ...dataToSave, id: newTransactionRef.id });

      // Handle installments
      const installmentCount = data.installments || 1;
      if (isCardExpense && installmentCount > 1) {
        const installmentAmount = calculatedAmount / installmentCount;
        const batch = writeBatch(firestore);
        const transactionDate = new Date(data.date);

        for (let i = 0; i < installmentCount; i++) {
          const installmentDate = add(transactionDate, { months: i });
          const installmentDocRef = doc(collection(firestore, `users/${user.uid}/transactions/${newTransactionRef.id}/installments`));
          
          batch.set(installmentDocRef, {
            id: installmentDocRef.id,
            transactionId: newTransactionRef.id,
            dueDate: installmentDate.toISOString(),
            amount: installmentAmount,
            isPaid: false,
          });
        }
        await batch.commit();
      }
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
                                    defaultValue={field.value} 
                                    className="grid grid-cols-2 gap-2"
                                >
                                    <FormItem>
                                        <RadioGroupItem value="expense" id="r1" className="sr-only" />
                                        <FormLabel htmlFor="r1">
                                            <div className={cn(
                                                "flex items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground",
                                                field.value === 'expense' && "border-destructive"
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
                
                <div className={cn("text-right text-lg font-bold", type === 'expense' && "text-destructive")}>
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
                                                        value={tag.name}
                                                        onSelect={(currentValue) => {
                                                          const tagId = tags.find(t => t.name.toLowerCase() === currentValue.toLowerCase())?.id;
                                                          if (!tagId) return;

                                                          const selectedTags = field.value || [];
                                                          const isSelected = selectedTags.includes(tagId);
                                                          
                                                          if (isSelected) {
                                                              field.onChange(selectedTags.filter(id => id !== tagId));
                                                          } else {
                                                              field.onChange([...selectedTags, tagId]);
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




