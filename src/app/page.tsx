
'use client';

import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { placeholderImages } from '@/lib/placeholder-images';
import { initiateGoogleSignIn, useAuth, useUser } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { doc, getDoc, collection, writeBatch } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import { setDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { seedCategories, seedTags } from '@/lib/seed-data';

const seedUserData = async (firestore: any, userId: string) => {
  const batch = writeBatch(firestore);

  // Seed Categories
  const categoriesCollection = collection(firestore, `users/${userId}/categories`);
  seedCategories.forEach(category => {
    const docRef = doc(categoriesCollection);
    batch.set(docRef, { ...category, userId });
  });

  // Seed Tags
  const tagsCollection = collection(firestore, `users/${userId}/tags`);
  seedTags.forEach(tag => {
    const docRef = doc(tagsCollection);
    batch.set(docRef, { ...tag, userId });
  });

  await batch.commit();
};


export default function LoginPage() {
  const loginImage = placeholderImages.find(image => image.id === 'login-illustration');
  const auth = useAuth();
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const firestore = useFirestore();

  useEffect(() => {
    if (!isUserLoading && user && firestore) {
      const userRef = doc(firestore, 'users', user.uid);
      
      getDoc(userRef).then(userDoc => {
        if (!userDoc.exists()) {
          // New user, create user doc and seed data
          const userData = {
            id: user.uid,
            googleId: user.providerData.find(p => p.providerId === 'google.com')?.uid,
            email: user.email,
            name: user.displayName,
          };
          setDocumentNonBlocking(userRef, userData, { merge: true });
          seedUserData(firestore, user.uid).then(() => {
            router.push('/dashboard');
          });
        } else {
          // Existing user, just go to dashboard
          router.push('/dashboard');
        }
      });
    }
  }, [user, isUserLoading, router, firestore]);

  const handleGoogleLogin = () => {
    initiateGoogleSignIn(auth);
  };

  if (isUserLoading || user) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="w-full lg:grid lg:min-h-screen lg:grid-cols-2">
      <div className="flex items-center justify-center py-12">
        <div className="mx-auto grid w-[350px] gap-6">
          <div className="grid gap-2 text-center">
            <h1 className="text-3xl font-bold font-headline">FinanceFlow</h1>
            <p className="text-balance text-muted-foreground">
              Sign in to manage your finances
            </p>
          </div>
          <Button variant="outline" className="w-full" onClick={handleGoogleLogin}>
            Login with Google
          </Button>
        </div>
      </div>
      <div className="hidden bg-muted lg:block">
        {loginImage && (
          <Image
            src={loginImage.imageUrl}
            alt="Illustration of financial charts and graphs"
            width="1920"
            height="1080"
            className="h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
            data-ai-hint={loginImage.imageHint}
          />
        )}
      </div>
    </div>
  );
}
