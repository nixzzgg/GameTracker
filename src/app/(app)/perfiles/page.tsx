"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { getPublicProfiles } from './actions';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Gamepad2 } from 'lucide-react';
import type { User as UserType } from '@/lib/types';
import type { GameState } from '@/hooks/use-game-store';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface ProfileWithLists {
  user: UserType;
  lists: GameState;
}

export default function PerfilesPage() {
  const { user: currentUser } = useAuth();
  const [profiles, setProfiles] = useState<ProfileWithLists[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProfiles() {
      if (!currentUser) return;
      setLoading(true);
      const allProfiles = await getPublicProfiles();
      const otherProfiles = allProfiles.filter(p => p.user.id !== currentUser.id);
      setProfiles(otherProfiles);
      setLoading(false);
    }

    fetchProfiles();
  }, [currentUser]);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-8">
        <header className="text-center space-y-4">
          <div>
            <h1 className="text-3xl font-bold font-headline text-primary">Perfiles de la comunidad</h1>
            <p className="text-muted-foreground mt-1">Descubre qué están jugando otros usuarios</p>
          </div>
        </header>

        
        <main className="space-y-10">
          {!loading && (
            <>
              {profiles.length > 0 ? (
                <div className="max-w-5xl mx-auto">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {profiles.map(({ user, lists }) => (
                      <Link href={`/perfiles/${user.id}`} key={user.id}>
                        <Card className="h-full">
                          <CardHeader>
                              <div className="flex items-center gap-4">
                                   <Avatar className="h-12 w-12">
                                      <AvatarImage src={user.profilePicture} />
                                      <AvatarFallback>{user.username.charAt(0).toUpperCase()}</AvatarFallback>
                                  </Avatar>
                                  <div>
                                      <CardTitle className="text-xl font-headline">{user.username}</CardTitle>
                                      <CardDescription className="mt-1 line-clamp-2">
                                          {user.description || 'Sin descripción'}
                                      </CardDescription>
                                  </div>
                              </div>
                          </CardHeader>
                        </Card>
                      </Link>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="max-w-4xl mx-auto text-center py-16">
                  <Gamepad2 className="mx-auto h-16 w-16 text-muted-foreground/50" />
                  <h3 className="mt-4 text-xl font-semibold font-headline">Aún no hay otros perfiles</h3>
                  <p className="mt-2 text-muted-foreground">Invita a tus amigos a unirse</p>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
