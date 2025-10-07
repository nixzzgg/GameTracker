"use client";

import AppSidebar from '@/components/app-sidebar';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Menu, Gamepad2 } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  // Refs for swipe gesture
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const touchEndX = useRef(0);
  const touchEndY = useRef(0);
  const touchStartTime = useRef(0);
  const ignoreSwipe = useRef(false);

  const swipeThreshold = 50; // Minimum horizontal distance for a swipe in pixels
  const swipeTimeThreshold = 500; // Maximum time for a swipe in ms
  const swipeVelocityThreshold = 0.3; // Minimum velocity (px/ms) for a fast swipe
  const verticalSwipeThreshold = 40; // Max vertical distance to still be considered a horizontal swipe

  useEffect(() => {
    // We only want to check for redirection after the initial loading is complete.
    if (loading) {
      return;
    }
    // If not loading and there is no user, redirect to login.
    if (!user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  // While loading or if there's no user yet (before redirect), show null.
  if (loading || !user) {
    return null;
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    ignoreSwipe.current = false;
    let targetElement = e.target as HTMLElement;

    // Traverse up the DOM to check for scrollable parents or carousels
    while (targetElement && targetElement !== e.currentTarget) {
        const style = window.getComputedStyle(targetElement);
        // Check for native horizontal scroll
        if ((style.overflowX === 'auto' || style.overflowX === 'scroll') && targetElement.scrollWidth > targetElement.clientWidth) {
            ignoreSwipe.current = true;
            break;
        }
        // Check for custom data attribute on carousels, which use JS for scrolling
        if (targetElement.dataset.horizontalScroll) {
            ignoreSwipe.current = true;
            break;
        }
        targetElement = targetElement.parentElement as HTMLElement;
    }

    touchStartX.current = e.targetTouches[0].clientX;
    touchStartY.current = e.targetTouches[0].clientY;
    touchEndX.current = e.targetTouches[0].clientX;
    touchEndY.current = e.targetTouches[0].clientY;
    touchStartTime.current = e.timeStamp;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
    touchEndY.current = e.targetTouches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (ignoreSwipe.current) {
        return;
    }
    
    const touchEndTime = e.timeStamp;
    const swipeDistanceX = touchEndX.current - touchStartX.current;
    const swipeDistanceY = touchEndY.current - touchStartY.current;
    const swipeDuration = touchEndTime - touchStartTime.current;

    // Ignore if swipe is too slow or mostly vertical
    if (swipeDuration > swipeTimeThreshold || Math.abs(swipeDistanceY) > verticalSwipeThreshold) {
      return;
    }

    const velocity = Math.abs(swipeDistanceX) / swipeDuration;

    // Ignore if not a fast enough swipe
    if (velocity < swipeVelocityThreshold) {
      return;
    }

    // Right swipe (to open)
    if (swipeDistanceX > swipeThreshold && !isSheetOpen) {
      setIsSheetOpen(true);
    }

    // Left swipe (to close)
    if (swipeDistanceX < -swipeThreshold && isSheetOpen) {
      setIsSheetOpen(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <div className="hidden border-r bg-card md:fixed md:inset-y-0 md:flex md:w-64 md:flex-col">
        <AppSidebar />
      </div>
      <div 
        className="flex flex-col md:pl-64"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background px-4 md:hidden">
          <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
            <SheetTrigger asChild>
              <Button size="icon" variant="outline" className="h-8 w-8">
                <Menu className="h-4 w-4" />
                <span className="sr-only">Abrir menú</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0 [&>button]:hidden">
              <SheetHeader className="sr-only">
                <SheetTitle>Menú principal</SheetTitle>
              </SheetHeader>
              <AppSidebar onLinkClick={() => setIsSheetOpen(false)} />
            </SheetContent>
          </Sheet>
          <div className="flex-1 text-center">
            <Link href="/panel" className="inline-flex items-center gap-2">
              <Gamepad2 className="h-6 w-6 text-primary" />
              <h1 className="text-lg font-bold font-headline">GameTracker</h1>
            </Link>
          </div>
          <div className="w-8 h-8"/>
        </header>
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
