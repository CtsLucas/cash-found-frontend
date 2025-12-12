
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
import { addDocumentNonBlocking, setDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { collection, doc } from "firebase/firestore";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card as CardType } from "@/lib/types";
import { CurrencyInput } from "../ui/currency-input";
  
const cardSchema = z.object({
    cardName: z.string().min(1, "Card name is required"),
    limit: z.coerce.number().positive("Limit must be positive"),
    dueDate: z.string().min(1, "Due date is required"),
    last4: z.string().length(4, "Must be 4 digits").regex(/^\d{4}$/, "Must be 4 digits"),
    color: z.string().optional(),
    userId: z.string()
});

type CardFormValues = z.infer<typeof cardSchema>;

interface AddCardSheetProps {
    children?: React.ReactNode;
    isOpen?: boolean;
    onOpenChange?: (isOpen: boolean) => void;
    editingCard?: CardType | null;
}

export function AddCardSheet({ isOpen: controlledIsOpen, onOpenChange: setControlledIsOpen, editingCard, children }: AddCardSheetProps) {
  const firestore = useFirestore();
  const { user } = useUser();
  const [isInternalOpen, setInternalOpen] = React.useState(false);

  const isEditing = !!editingCard;
  const isOpen = controlledIsOpen ?? isInternalOpen;
  const setIsOpen = setControlledIsOpen ?? setInternalOpen;

  const form = useForm<CardFormValues>({
    resolver: zodResolver(cardSchema),
    defaultValues: {
      cardName: "",
      limit: 0,
      dueDate: "",
      last4: "",
      color: "#6b7280",
      userId: user?.uid
    },
  });

  React.useEffect(() => {
    if (user) {
        const defaultValues = {
            cardName: "",
            limit: 0,
            dueDate: "",
            last4: "",
            color: "#6b7280",
            userId: user.uid
        };

        if (isEditing && editingCard) {
            // Firestore date is a string 'YYYY-MM-DD', which is what the input expects.
            // No conversion is needed.
            form.reset({
                ...editingCard,
                dueDate: editingCard.dueDate || '',
            });
        } else {
            form.reset(defaultValues);
        }
    }
  }, [user, form, isOpen, editingCard, isEditing]);

  const onSubmit = (data: CardFormValues) => {
    if (!user) return;
    
    if (isEditing && editingCard?.id) {
        const cardRef = doc(firestore, `users/${user.uid}/cards/${editingCard.id}`);
        setDocumentNonBlocking(cardRef, data, { merge: true });
    } else {
        const cardsCollection = collection(firestore, `users/${user.uid}/cards`);
        addDocumentNonBlocking(cardsCollection, data);
    }
    
    setIsOpen(false);
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
        {children ? (
             <SheetTrigger asChild>{children}</SheetTrigger>
        ) : (
            <SheetTrigger asChild>
                <Button size="sm" className="h-8 gap-1">
                <PlusCircle className="h-3.5 w-3.5" />
                <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                    Add Card
                </span>
                </Button>
            </SheetTrigger>
        )}
      <SheetContent className="sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{isEditing ? 'Edit Card' : 'Add a new card'}</SheetTitle>
          <SheetDescription>
            {isEditing ? 'Update the details of your card.' : 'Fill in the details below to add a new card to your wallet.'}
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
                                <CurrencyInput
                                    placeholder="$10,000.00"
                                    value={field.value}
                                    onValueChange={field.onChange}
                                />
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
                        name="last4"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Last 4 digits</FormLabel>
                                <FormControl>
                                    <Input placeholder="1234" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
                 <FormField
                      control={form.control}
                      name="color"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Card Color</FormLabel>
                          <FormControl>
                            <Input type="color" {...field} className="h-10 p-1 w-full"/>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                
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
