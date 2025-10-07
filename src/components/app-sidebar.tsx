"use client";

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Gamepad2, LayoutGrid, Trello, LogOut, Compass, Users, Map } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';

const navItems = [
  { href: '/panel', label: 'Panel', icon: Trello },
  { href: '/inicio', label: 'Inicio', icon: LayoutGrid },
  { href: '/explorar', label: 'Explorar', icon: Compass },
  { href: '/perfiles', label: 'Perfiles', icon: Users },
];

interface AppSidebarProps {
  onLinkClick?: () => void;
}

export default function AppSidebar({ onLinkClick }: AppSidebarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleSignOut = () => {
    logout();
    router.push('/login');
    if (onLinkClick) {
      onLinkClick();
    }
  };

  return (
      <aside className={cn("flex h-full flex-col bg-card text-card-foreground p-4")}>
        <div className="flex-1">
          <Link href="/panel" onClick={onLinkClick} className="flex items-center gap-2 mb-8 px-2">
              <Gamepad2 className="h-8 w-8 text-primary" />
              <h1 className="text-xl font-bold font-headline">GameTracker</h1>
          </Link>
          <nav className="flex flex-col gap-y-1">
            {navItems.map((item) => (
              <Link href={item.href} key={item.href} passHref>
                  <Button
                      onClick={onLinkClick}
                      variant={pathname.startsWith(item.href) ? 'secondary' : 'ghost'}
                      className="w-full justify-start text-md h-11"
                      aria-label={item.label}
                  >
                      <item.icon className="mr-3 h-5 w-5" />
                      {item.label}
                  </Button>
              </Link>
            ))}
          </nav>
        </div>
        
        <div className="mt-auto flex flex-col gap-2">
            <Separator className="my-1 bg-border/50" />
            <Link href="/perfil" onClick={onLinkClick} className="w-full">
                <Button
                    variant={pathname === '/perfil' ? 'secondary' : 'ghost'}
                    className="w-full justify-start text-md h-auto p-2"
                >
                    <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                            <AvatarImage src={user?.profilePicture} alt={user?.username} />
                            <AvatarFallback>{user?.username?.charAt(0).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <span className="font-medium truncate">{user?.username}</span>
                    </div>
                </Button>
            </Link>
            <Button
                variant="ghost"
                className="w-full justify-start text-md h-11"
                onClick={handleSignOut}
            >
                <LogOut className="mr-3 h-5 w-5" />
                Cerrar sesión
            </Button>
        </div>
      </aside>
  );
}
