
'use client';

import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { placeholderImages } from '@/lib/placeholder-images';
import { initiateGoogleSignIn, useAuth, useUser } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { doc, getDoc, collection, writeBatch } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import { setDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { seedCategories, seedTags } from '@/lib/seed-data';
import { useLanguage } from '@/components/i18n/language-provider';
import { User } from 'firebase/auth';

const seedUserData = async (firestore: any, userId: string) => {
  const batch = writeBatch(firestore);

  // Seed Categories
  const categoriesCollection = collection(firestore, `users/${userId}/categories`);
  seedCategories.forEach(category => {
    const docRef = doc(categoriesCollection);
    batch.set(docRef, { ...category, id: docRef.id, userId });
  });

  // Seed Tags
  const tagsCollection = collection(firestore, `users/${userId}/tags`);
  seedTags.forEach(tag => {
    const docRef = doc(tagsCollection);
    batch.set(docRef, { ...tag, id: docRef.id, userId });
  });

  await batch.commit();
};


export default function LoginPage() {
  const loginImage = placeholderImages.find(image => image.id === 'login-illustration');
  const auth = useAuth();
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const firestore = useFirestore();
  const { t } = useLanguage();
  const [isProcessingLogin, setIsProcessingLogin] = useState(false);

  useEffect(() => {
    if (!isUserLoading && user) {
      router.push('/dashboard');
    }
  }, [isUserLoading, user, router]);

  const processUser = async (user: User) => {
    if (!firestore) return;
    const userRef = doc(firestore, 'users', user.uid);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      const userData = {
        id: user.uid,
        googleId: user.providerData.find(p => p.providerId === 'google.com')?.uid,
        email: user.email,
        name: user.displayName,
      };
      await setDocumentNonBlocking(userRef, userData, { merge: true });
      await seedUserData(firestore, user.uid);
    }
    router.push('/dashboard');
  };

  const handleGoogleLogin = async () => {
    setIsProcessingLogin(true);
    try {
      const result = await initiateGoogleSignIn(auth);
      if (result && result.user) {
        await processUser(result.user);
      } else {
        setIsProcessingLogin(false);
      }
    } catch (error) {
      console.error("Google login error:", error);
      setIsProcessingLogin(false);
    }
  };

  if (isUserLoading || user) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <p>{t('loading')}...</p>
      </div>
    );
  }

  return (
    <div className="w-full lg:grid lg:min-h-screen lg:grid-cols-2">
      <div className="flex items-center justify-center py-12">
        <div className="mx-auto grid w-[350px] gap-6">
          <div className="grid gap-2 text-center">
            <h1 className="text-3xl font-bold font-headline">CashFound</h1>
            <p className="text-balance text-muted-foreground">
              {t('login.subtitle')}
            </p>
          </div>
          <Button variant="outline" className="w-full" onClick={handleGoogleLogin} disabled={isProcessingLogin}>
             {isProcessingLogin ? `${t('loading')}...` : t('login.with_google')}
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
