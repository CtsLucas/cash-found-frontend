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
import { PlusCircle } from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
  } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import React from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useFirestore, useUser, useCollection, useMemoFirebase } from "@/firebase";
import { addDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { collection } from "firebase/firestore";
import { Category, Transaction } from "@/lib/types";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
  
const transactionSchema = z.object({
    type: z.enum(["expense", "income"]),
    amount: z.coerce.number().positive(),
    deduction: z.coerce.number().optional(),
    description: z.string().min(1, "Description is required."),
    category: z.string().min(1, "Category is required."),
    date: z.string().min(1, "Date is required."),
    installment: z.boolean().optional(),
    userId: z.string()
});

type TransactionFormValues = z.infer<typeof transactionSchema>;

export function AddTransactionSheet() {
  const firestore = useFirestore();
  const { user } = useUser();
  const [isOpen, setIsOpen] = React.useState(false);

  const categoriesQuery = useMemoFirebase(() => {
    if (!user) return null;
    return collection(firestore, `users/${user.uid}/categories`);
  }, [firestore, user]);

  const { data: categories } = useCollection<Category>(categoriesQuery);

  const form = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      type: "expense",
      amount: 0,
      deduction: 0,
      description: "",
      category: "",
      date: new Date().toISOString().split("T")[0],
      installment: false,
      userId: user?.uid
    },
  });

  const type = form.watch("type");

  React.useEffect(() => {
    if (user) {
        form.reset({
            type: "expense",
            amount: 0,
            deduction: 0,
            description: "",
            category: "",
            date: new Date().toISOString().split("T")[0],
            installment: false,
            userId: user.uid
        });
    }
  }, [user, form, isOpen]);

  const onSubmit = (data: TransactionFormValues) => {
    if (!user) return;
    const transactionsCollection = collection(firestore, `users/${user.uid}/transactions`);
    addDocumentNonBlocking(transactionsCollection, data);
    setIsOpen(false);
    form.reset();
  };

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
      <SheetContent>
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
                        <FormItem className="grid grid-cols-4 items-center gap-4">
                            <FormLabel className="text-right">Type</FormLabel>
                            <FormControl>
                                <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="col-span-3 flex items-center gap-4">
                                    <FormItem className="flex items-center space-x-2">
                                        <FormControl>
                                            <RadioGroupItem value="expense" id="r1" />
                                        </FormControl>
                                        <FormLabel htmlFor="r1">Expense</FormLabel>
                                    </FormItem>
                                    <FormItem className="flex items-center space-x-2">
                                        <FormControl>
                                            <RadioGroupItem value="income" id="r2" />
                                        </FormControl>
                                        <FormLabel htmlFor="r2">Income</FormLabel>
                                    </FormItem>
                                </RadioGroup>
                            </FormControl>
                            <FormMessage className="col-span-4" />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="amount"
                    render={({ field }) => (
                        <FormItem className="grid grid-cols-4 items-center gap-4">
                            <FormLabel className="text-right">Amount</FormLabel>
                            <FormControl>
                                <Input type="number" placeholder="$0.00" {...field} className="col-span-3" />
                            </FormControl>
                            <FormMessage className="col-start-2 col-span-3" />
                        </FormItem>
                    )}
                />
                 {type === 'expense' && (
                    <FormField
                        control={form.control}
                        name="deduction"
                        render={({ field }) => (
                            <FormItem className="grid grid-cols-4 items-center gap-4">
                                <FormLabel className="text-right">Deduction</FormLabel>
                                <FormControl>
                                    <Input type="number" placeholder="$0.00" {...field} className="col-span-3" />
                                </FormControl>
                                <FormMessage className="col-start-2 col-span-3" />
                            </FormItem>
                        )}
                    />
                 )}
                <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                        <FormItem className="grid grid-cols-4 items-center gap-4">
                            <FormLabel className="text-right">Description</FormLabel>
                            <FormControl>
                                <Input placeholder="e.g. Groceries" {...field} className="col-span-3" />
                            </FormControl>
                            <FormMessage className="col-start-2 col-span-3" />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                        <FormItem className="grid grid-cols-4 items-center gap-4">
                            <FormLabel className="text-right">Category</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                <SelectTrigger className="col-span-3">
                                    <SelectValue placeholder="Select a category" />
                                </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {categories?.map(cat => <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                            <FormMessage className="col-start-2 col-span-3" />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="date"
                    render={({ field }) => (
                        <FormItem className="grid grid-cols-4 items-center gap-4">
                            <FormLabel className="text-right">Date</FormLabel>
                            <FormControl>
                                <Input type="date" {...field} className="col-span-3" />
                            </FormControl>
                            <FormMessage className="col-start-2 col-span-3" />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="installment"
                    render={({ field }) => (
                        <FormItem className="grid grid-cols-4 items-center gap-4">
                             <div className="col-start-2 col-span-3 flex items-center space-x-2">
                                <FormControl>
                                    <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                                </FormControl>
                                <FormLabel>This is an installment</FormLabel>
                            </div>
                        </FormItem>
                    )}
                />
                
                <SheetFooter>
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
