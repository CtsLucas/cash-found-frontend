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
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useFirestore, useUser } from "@/firebase";
import { addDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { collection } from "firebase/firestore";
import React from "react";

const itemSchema = z.object({
  name: z.string().min(1, "Name is required"),
  userId: z.string(),
});

type ItemFormValues = z.infer<typeof itemSchema>;

export function AddItemSheet() {
  const [isOpen, setIsOpen] = React.useState(false);
  const firestore = useFirestore();
  const { user } = useUser();

  const form = useForm<ItemFormValues>({
    resolver: zodResolver(itemSchema),
    defaultValues: {
      name: "",
      userId: user?.uid,
    }
  });

  React.useEffect(() => {
    if (user) {
        form.setValue("userId", user.uid);
    }
    if (!isOpen) {
        form.reset({ name: "", userId: user?.uid });
    }
  }, [user, form, isOpen]);

  const onSubmit = (data: ItemFormValues) => {
    if (!user) return;
    // This is a generic component, so we can't know which collection to add to.
    // This would need to be passed as a prop. For now, we can assume categories.
    // A better implementation would have separate forms for categories and tags.
    const itemsCollection = collection(firestore, `users/${user.uid}/categories`);
    addDocumentNonBlocking(itemsCollection, data);
    setIsOpen(false);
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button size="sm" className="h-8 gap-1">
          <PlusCircle className="h-3.5 w-3.5" />
          <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
            Add Item
          </span>
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Add a new item</SheetTitle>
          <SheetDescription>
            Fill in the details below to add a new item.
          </SheetDescription>
        </SheetHeader>
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 py-4">
                <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                        <FormItem className="grid grid-cols-4 items-center gap-4">
                            <FormLabel className="text-right">Name</FormLabel>
                            <FormControl>
                                <Input placeholder="Item name" {...field} className="col-span-3" />
                            </FormControl>
                            <FormMessage className="col-start-2 col-span-3"/>
                        </FormItem>
                    )}
                />
                <SheetFooter>
                    <SheetClose asChild>
                        <Button variant="outline">Cancel</Button>
                    </SheetClose>
                    <Button type="submit">Save item</Button>
                </SheetFooter>
            </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
