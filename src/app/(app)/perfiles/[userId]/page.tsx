import { getPublicProfile } from '../actions';
import GameColumn from '@/components/dashboard/game-column';
import GameStatsChart from '@/components/dashboard/game-stats-chart';
import DuelCard from '@/components/perfiles/duel-card';
import { notFound } from 'next/navigation';
import type { GameState } from '@/hooks/use-game-store';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart4 } from 'lucide-react';

export const revalidate = 60;

export default async function UserProfilePage({ params }: { params: { userId: string } }) {
  const { userId } = params;
  const { user, lists } = await getPublicProfile(userId);

  if (!user || !lists) {
    notFound();
  }

  const chartData: GameState = {
    completed: lists.completed || [],
    playing: lists.playing || [],
    wishlist: lists.wishlist || [],
    dropped: lists.dropped || [],
    recommendations: [],
  };

  const hasGames = chartData.completed.length > 0 || chartData.playing.length > 0 || chartData.wishlist.length > 0 || chartData.dropped.length > 0;

  return (
    <div className="p-4 md:p-6 space-y-6">
      <header>
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <Avatar className="h-24 w-24">
            <AvatarImage src={user.profilePicture} />
            <AvatarFallback className="text-4xl">{user.username.charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="text-center sm:text-left">
            <h1 className="text-3xl font-bold font-headline text-primary">{user.username}</h1>
            <p className="text-muted-foreground mt-1 max-w-prose">{user.description || 'Sin descripción'}</p>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
        <Card>
          <CardHeader>
            <CardTitle className="font-headline flex items-center gap-2">
              <BarChart4 className="h-6 w-6 text-primary" />
              Estadísticas
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 md:p-6 md:pt-0 -mt-2">
            {hasGames ? <GameStatsChart data={chartData} /> : <p className="text-muted-foreground text-center">Este usuario aún no tiene juegos en sus listas</p>}
          </CardContent>
        </Card>
        <DuelCard viewedUser={user} viewedUserLists={lists} />
      </div>

      <div>
        <h2 className="text-2xl font-bold font-headline mb-4">Colección de juegos</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          <GameColumn title="Completados" status="completed" games={lists.completed} isReadOnly />
          <GameColumn title="Jugando" status="playing" games={lists.playing} isReadOnly />
          <GameColumn title="Wishlist" status="wishlist" games={lists.wishlist} isReadOnly />
          <GameColumn title="Abandonados" status="dropped" games={lists.dropped} isReadOnly />
        </div>
      </div>
    </div>
  );
}
