"use client";

import Link from 'next/link';
import { Gamepad2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.replace('/panel');
    }
  }, [user, loading, router]);

  if (loading || user) {
    return (
      <div className="flex flex-col min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-20 w-20 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen items-center justify-center bg-background p-4 text-center">
      <div className="flex flex-col items-center gap-6">
        <div className="flex flex-row items-center gap-4">
          <Gamepad2 className="h-12 w-12 md:h-20 md:w-20 text-primary" />
          <h1 className="text-4xl md:text-6xl font-bold font-headline tracking-tighter">
            GameTracker
          </h1>
        </div>
        <p className="max-w-md text-lg text-muted-foreground mt-2 md:text-xl">
          Inicia sesión o regístrate para empezar a organizar tu mundo de juegos
        </p>
        <div className="flex flex-col sm:flex-row gap-4 mt-6">
          <Button asChild size="lg">
            <Link href="/login">Iniciar sesión</Link>
          </Button>
          <Button asChild variant="secondary" size="lg">
            <Link href="/registro">Regístrate</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
