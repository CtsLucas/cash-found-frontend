
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
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useFirestore, useUser } from "@/firebase";
import { addDocumentNonBlocking, setDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { collection, doc } from "firebase/firestore";
import React from "react";
import { Category, Tag } from "@/lib/types";
import { useLanguage } from "../i18n/language-provider";

const itemSchema = z.object({
  name: z.string().min(1, "Name is required"),
  userId: z.string(),
});

type ItemFormValues = z.infer<typeof itemSchema>;

type ItemType = "Category" | "Tag";

interface AddItemSheetProps {
    itemType: ItemType;
    isOpen?: boolean;
    onOpenChange?: (isOpen: boolean) => void;
    editingItem?: Category | Tag | null;
    children?: React.ReactNode;
}

export function AddItemSheet({ itemType, isOpen: controlledIsOpen, onOpenChange: setControlledIsOpen, editingItem }: AddItemSheetProps) {
  const [isInternalOpen, setInternalOpen] = React.useState(false);
  const firestore = useFirestore();
  const { user } = useUser();
  const { t } = useLanguage();

  const isOpen = controlledIsOpen ?? isInternalOpen;
  const setIsOpen = setControlledIsOpen ?? setInternalOpen;
  const isEditing = !!editingItem;


  const form = useForm<ItemFormValues>({
    resolver: zodResolver(itemSchema),
    defaultValues: {
      name: "",
      userId: user?.uid || "",
    }
  });

  React.useEffect(() => {
    if (user) {
      const defaultValues = {
        name: "",
        userId: user.uid,
      };

      if (isEditing && editingItem) {
        form.reset({
          name: editingItem.name,
          userId: user.uid
        });
      } else {
        form.reset(defaultValues);
      }
    }
  }, [user, form, isOpen, editingItem, isEditing]);

  const onSubmit = (data: ItemFormValues) => {
    if (!user) return;
    
    const collectionName = itemType === 'Category' ? 'categories' : 'tags';
    
    if (isEditing && editingItem?.id) {
        const itemRef = doc(firestore, `users/${user.uid}/${collectionName}/${editingItem.id}`);
        setDocumentNonBlocking(itemRef, data, { merge: true });
    } else {
        const itemsCollection = collection(firestore, `users/${user.uid}/${collectionName}`);
        addDocumentNonBlocking(itemsCollection, data);
    }
    
    setIsOpen(false);
  };
  
  const itemTypeT = itemType === 'Category' ? t('category') : t('tag');

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button size="sm" className="h-8 gap-1">
          <PlusCircle className="h-3.5 w-3.5" />
          <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
            {t('add')} {itemTypeT}
          </span>
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>{isEditing ? `${t('edit')} ${itemTypeT}` : `${t('add')} ${itemTypeT}`}</SheetTitle>
          <SheetDescription>
            {isEditing ? t('management.form.edit_description') : t('management.form.add_description')}
          </SheetDescription>
        </SheetHeader>
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 py-4">
                <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                        <FormItem className="grid grid-cols-4 items-center gap-4">
                            <FormLabel className="text-right">{t('name')}</FormLabel>
                            <FormControl>
                                <Input placeholder={`${itemTypeT} ${t('name').toLowerCase()}`} {...field} className="col-span-3" />
                            </FormControl>
                            <FormMessage className="col-start-2 col-span-3"/>
                        </FormItem>
                    )}
                />
                <SheetFooter>
                    <SheetClose asChild>
                        <Button variant="outline">{t('cancel')}</Button>
                    </SheetClose>
                    <Button type="submit">{t('save')} {itemTypeT}</Button>
                </SheetFooter>
            </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
