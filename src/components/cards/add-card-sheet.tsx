'use client';

import React from 'react';
import { useForm } from 'react-hook-form';

import { zodResolver } from '@hookform/resolvers/zod';
import { collection, doc } from 'firebase/firestore';
import { PlusCircle } from 'lucide-react';
import * as z from 'zod';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { useFirestore, useUser } from '@/firebase';
import { addDocumentNonBlocking, setDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { Card as CardType } from '@/lib/types';

import { useLanguage } from '../i18n/language-provider';
import { CurrencyInput } from '../ui/currency-input';

const cardSchema = z.object({
  cardName: z.string().min(1, 'Card name is required'),
  limit: z.coerce.number().positive('Limit must be positive'),
  dueDate: z.coerce.number().min(1, 'Due day is required').max(31, 'Must be a valid day'),
  last4: z
    .string()
    .length(4, 'Must be 4 digits')
    .regex(/^\d{4}$/, 'Must be 4 digits'),
  color: z.string().optional(),
  userId: z.string(),
});

type CardFormValues = z.infer<typeof cardSchema>;

interface AddCardSheetProps {
  children?: React.ReactNode;
  isOpen?: boolean;
  onOpenChange?: (isOpen: boolean) => void;
  editingCard?: CardType | null;
}

export function AddCardSheet({
  isOpen: controlledIsOpen,
  onOpenChange: setControlledIsOpen,
  editingCard,
  children,
}: AddCardSheetProps) {
  const firestore = useFirestore();
  const { user } = useUser();
  const { t } = useLanguage();
  const [isInternalOpen, setInternalOpen] = React.useState(false);

  const isEditing = !!editingCard;
  const isOpen = controlledIsOpen ?? isInternalOpen;
  const setIsOpen = setControlledIsOpen ?? setInternalOpen;

  const form = useForm<CardFormValues>({
    resolver: zodResolver(cardSchema),
    defaultValues: {
      cardName: '',
      limit: 0,
      dueDate: 1,
      last4: '',
      color: '#6b7280',
      userId: user?.uid,
    },
  });

  React.useEffect(() => {
    if (user) {
      const defaultValues = {
        cardName: '',
        limit: 0,
        dueDate: 1,
        last4: '',
        color: '#6b7280',
        userId: user.uid,
      };

      if (isEditing && editingCard) {
        form.reset({
          ...editingCard,
          dueDate: editingCard.dueDate || 1,
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
              {t('cards.add_button')}
            </span>
          </Button>
        </SheetTrigger>
      )}
      <SheetContent className="sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{isEditing ? t('cards.edit_title') : t('cards.add_title')}</SheetTitle>
          <SheetDescription>
            {isEditing ? t('cards.edit_description') : t('cards.add_description')}
          </SheetDescription>
        </SheetHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 py-4">
            <FormField
              control={form.control}
              name="cardName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('cards.form.name.label')}</FormLabel>
                  <FormControl>
                    <Input placeholder={t('cards.form.name.placeholder')} {...field} />
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
                  <FormLabel>{t('cards.form.limit.label')}</FormLabel>
                  <FormControl>
                    <CurrencyInput
                      placeholder="10,000.00"
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
                    <FormLabel>{t('cards.form.due_day.label')}</FormLabel>
                    <FormControl>
                      <Input type="number" min="1" max="31" {...field} />
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
                    <FormLabel>{t('cards.form.last4.label')}</FormLabel>
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
                  <FormLabel>{t('cards.form.color.label')}</FormLabel>
                  <FormControl>
                    <Input type="color" {...field} className="h-10 w-full p-1" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <SheetFooter className="pt-4">
              <SheetClose asChild>
                <Button variant="outline">{t('cancel')}</Button>
              </SheetClose>
              <Button type="submit">{t('save')}</Button>
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
