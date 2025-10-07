"use client";

import GameColumn from '@/components/dashboard/game-column';
import GameStatsChart from '@/components/dashboard/game-stats-chart';
import { useGameStore } from '@/hooks/use-game-store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart4 } from 'lucide-react';

export default function PanelPage() {
  const { state } = useGameStore();

  const hasGames = state.completed.length > 0 || state.playing.length > 0 || state.wishlist.length > 0 || state.dropped.length > 0;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-8">
        <header className="text-center space-y-4">
          <div>
            <h1 className="text-3xl font-bold font-headline text-primary">Tu panel de juegos</h1>
            <p className="text-muted-foreground mt-1">Gestiona tus juegos y sigue tu progreso</p>
          </div>
        </header>
        
        <main className="space-y-10">
          <div className="max-w-2xl mx-auto">
            <div className="flex justify-center">
              <Card className="w-full">
                <CardHeader>
                  <CardTitle className="font-headline flex items-center gap-2">
                    <BarChart4 className="h-6 w-6 text-primary" />
                    Estadísticas
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0 md:p-6 md:pt-0 -mt-2">
                  {hasGames ? (
                    <GameStatsChart data={state} />
                  ) : (
                    <div className="p-6 pt-0">
                      <p className="text-muted-foreground text-center">Añade juegos para ver tus estadísticas</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
          
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 md:gap-8">
              <GameColumn title="Completados" status="completed" games={state.completed} />
              <GameColumn title="Jugando" status="playing" games={state.playing} />
              <GameColumn title="Wishlist" status="wishlist" games={state.wishlist} />
              <GameColumn title="Abandonados" status="dropped" games={state.dropped} />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}