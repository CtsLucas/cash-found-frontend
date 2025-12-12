
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
import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useFirestore, useUser } from "@/firebase";
import { addDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { collection } from "firebase/firestore";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
  
const cardSchema = z.object({
    cardName: z.string().min(1, "Card name is required"),
    limit: z.coerce.number().positive("Limit must be positive"),
    dueDate: z.string().min(1, "Due date is required"),
    color: z.string().optional(),
    userId: z.string()
});

type CardFormValues = z.infer<typeof cardSchema>;

export function AddCardSheet() {
  const firestore = useFirestore();
  const { user } = useUser();
  const [isOpen, setIsOpen] = React.useState(false);

  const form = useForm<CardFormValues>({
    resolver: zodResolver(cardSchema),
    defaultValues: {
      cardName: "",
      limit: 0,
      dueDate: "",
      color: "#6b7280",
      userId: user?.uid
    },
  });

  React.useEffect(() => {
    if (user) {
        form.reset({
            cardName: "",
            limit: 0,
            dueDate: "",
            color: "#6b7280",
            userId: user.uid
        });
    }
  }, [user, form, isOpen]);

  const onSubmit = (data: CardFormValues) => {
    if (!user) return;
    const cardsCollection = collection(firestore, `users/${user.uid}/cards`);
    addDocumentNonBlocking(cardsCollection, data);
    setIsOpen(false);
    form.reset();
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button size="sm" className="h-8 gap-1">
          <PlusCircle className="h-3.5 w-3.5" />
          <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
            Add Card
          </span>
        </Button>
      </SheetTrigger>
      <SheetContent className="sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Add a new card</SheetTitle>
          <SheetDescription>
            Fill in the details below to add a new card to your wallet.
          </SheetDescription>
        </SheetHeader>
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 py-4">
                <FormField
                    control={form.control}
                    name="cardName"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Card Name</FormLabel>
                            <FormControl>
                                <Input placeholder="e.g. Chase Sapphire" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="limit"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Credit Limit</FormLabel>
                            <FormControl>
                                <Input type="number" placeholder="$10000" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                 <div className="grid grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="dueDate"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Due Date</FormLabel>
                                <FormControl>
                                    <Input type="date" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                      control={form.control}
                      name="color"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Card Color</FormLabel>
                          <FormControl>
                            <Input type="color" {...field} className="h-10 p-1"/>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                </div>
                
                <SheetFooter className="pt-4">
                    <SheetClose asChild>
                        <Button variant="outline">Cancel</Button>
                    </SheetClose>
                    <Button type="submit">Save card</Button>
                </SheetFooter>
            </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
