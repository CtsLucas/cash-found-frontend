
'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button, buttonVariants } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
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
} from "@/components/ui/alert-dialog"
import { useFirestore, useUser } from "@/firebase"
import { collection, deleteDoc, getDocs, writeBatch } from "firebase/firestore"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"

export default function SettingsPage() {
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  const router = useRouter();

  const handleDeleteAllData = async () => {
    if (!user || !firestore) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not delete data. Please try again.",
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
        invoicesSnapshot.forEach(invoiceDoc => {
            batch.delete(invoiceDoc.ref);
        })
      }
      
      await batch.commit();

      toast({
        title: "Data Deleted",
        description: "All your data has been successfully deleted.",
      });

      // Optional: redirect user after deletion
      router.push('/dashboard');

    } catch (error) {
      console.error("Error deleting user data:", error);
      toast({
        variant: "destructive",
        title: "Deletion Failed",
        description: "An error occurred while deleting your data. Please try again.",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight font-headline">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account settings and preferences.
        </p>
      </div>
      <Separator />

       <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="text-destructive">Danger Zone</CardTitle>
          <CardDescription>
            These actions are permanent and cannot be undone.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">Delete All Data</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete all
                  of your data, including transactions, cards, categories, and tags.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteAllData}
                  className={cn(buttonVariants({ variant: "destructive" }))}
                >
                  Continue
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>
    </div>
  )
}
