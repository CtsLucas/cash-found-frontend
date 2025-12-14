'use client';

import { useRouter } from 'next/navigation';

import { collection, getDocs, writeBatch } from 'firebase/firestore';

import { useLanguage } from '@/components/i18n/language-provider';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useFirestore, useUser } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { Locale } from '@/lib/types';
import { cn } from '@/lib/utils';

export default function SettingsPage() {
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  const router = useRouter();
  const { t, setLanguage, locale } = useLanguage();

  const handleDeleteAllData = async () => {
    if (!user || !firestore) {
      toast({
        variant: 'destructive',
        title: t('error'),
        description: t('settings.danger_zone.delete.error_description'),
      });
      return;
    }

    try {
      const collectionsToDelete = ['transactions', 'cards', 'categories', 'tags'];
      const batch = writeBatch(firestore);

      for (const collectionName of collectionsToDelete) {
        const collectionRef = collection(firestore, `users/${user.uid}/${collectionName}`);
        const querySnapshot = await getDocs(collectionRef);
        querySnapshot.forEach((doc) => {
          batch.delete(doc.ref);
        });
      }

      // Also delete nested collections if any (e.g., invoices)
      const cardsSnapshot = await getDocs(collection(firestore, `users/${user.uid}/cards`));
      for (const cardDoc of cardsSnapshot.docs) {
        const invoicesRef = collection(firestore, `users/${user.uid}/cards/${cardDoc.id}/invoices`);
        const invoicesSnapshot = await getDocs(invoicesRef);
        invoicesSnapshot.forEach((invoiceDoc) => {
          batch.delete(invoiceDoc.ref);
        });
      }

      await batch.commit();

      toast({
        title: t('settings.danger_zone.delete.success_title'),
        description: t('settings.danger_zone.delete.success_description'),
      });

      // Optional: redirect user after deletion
      router.push('/dashboard');
    } catch (error) {
      console.error('Error deleting user data:', error);
      toast({
        variant: 'destructive',
        title: t('settings.danger_zone.delete.error_title'),
        description: t('settings.danger_zone.delete.error_description_generic'),
      });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-headline text-3xl font-bold tracking-tight">{t('settings.title')}</h1>
        <p className="text-muted-foreground">{t('settings.description')}</p>
      </div>
      <Separator />

      <Card>
        <CardHeader>
          <CardTitle>{t('settings.language.title')}</CardTitle>
          <CardDescription>{t('settings.language.description')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="w-full max-w-sm">
            <Label htmlFor="language-select">{t('settings.language.label')}</Label>
            <Select value={locale} onValueChange={(value) => setLanguage(value as Locale)}>
              <SelectTrigger id="language-select">
                <SelectValue placeholder={t('settings.language.select_placeholder')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pt-BR">Português (Brasil)</SelectItem>
                <SelectItem value="en">English</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="text-destructive">{t('settings.danger_zone.title')}</CardTitle>
          <CardDescription>{t('settings.danger_zone.description')}</CardDescription>
        </CardHeader>
        <CardContent>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">{t('settings.danger_zone.delete.button')}</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{t('are_you_sure')}</AlertDialogTitle>
                <AlertDialogDescription>
                  {t('settings.danger_zone.delete.alert_description')}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteAllData}
                  className={cn(buttonVariants({ variant: 'destructive' }))}
                >
                  {t('continue')}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>
    </div>
  );
}
