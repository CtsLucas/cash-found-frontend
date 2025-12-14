'use client';

import { type ReactNode, useEffect } from 'react';
import { useRouter } from 'next/navigation';

import { useUser } from '@/firebase';

import { useLanguage } from '../i18n/language-provider';

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const { t } = useLanguage();

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/');
    }
  }, [user, isUserLoading, router]);

  if (isUserLoading || !user) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <p>{t('loading')}...</p>
      </div>
    );
  }

  return <>{children}</>;
}
