import type { Game, GameStatus } from '@/lib/types';
import GameCard from '@/components/game-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, Heart, PlayCircle, XCircle } from 'lucide-react';

const statusIcons = {
  completed: <CheckCircle2 className="h-5 w-5 text-green-500" />,
  playing: <PlayCircle className="h-5 w-5 text-blue-500" />,
  wishlist: <Heart className="h-5 w-5 text-pink-500" />,
  dropped: <XCircle className="h-5 w-5 text-red-500" />,
};

interface GameColumnProps {
  title: string;
  status: GameStatus;
  games: Game[];
  isReadOnly?: boolean;
}

export default function GameColumn({ title, status, games, isReadOnly = false }: GameColumnProps) {
  return (
    <Card className="border-2 bg-card/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-headline">
          {statusIcons[status]}
          {title}
          <span className="ml-auto text-sm font-normal bg-muted text-muted-foreground rounded-full px-2 py-0.5">{games.length}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {games.length > 0 ? (
          <div className="max-h-[488px] overflow-y-auto scrollbar-hide">
            <div className="flex flex-col gap-4">
              {games.map((game) => <GameCard key={game.id} game={game} currentStatus={status} isReadOnly={isReadOnly} />)}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-center text-muted-foreground p-8 rounded-lg min-h-[200px]">
            <p>Aún no hay juegos en esta lista</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
