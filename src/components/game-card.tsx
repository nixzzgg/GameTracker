"use client";

import Image from 'next/image';
import { MoreHorizontal, CheckCircle2, Heart, PlayCircle, XCircle, Trash2, Clock, BrainCircuit, Loader2 } from 'lucide-react';
import type { Game, GameStatus } from '@/lib/types';
import { useGameStore } from '@/hooks/use-game-store';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useState, useCallback } from 'react';
import { getGameDetails } from '@/app/(app)/search/actions';


interface GameCardProps {
  game: Game;
  currentStatus: GameStatus;
  isReadOnly?: boolean;
}

const statusConfig: { [key in GameStatus]: { label: string; icon: React.ReactNode } } = {
  playing: { label: 'Jugando', icon: <PlayCircle className="mr-2 h-4 w-4" /> },
  wishlist: { label: 'Wishlist', icon: <Heart className="mr-2 h-4 w-4" /> },
  completed: { label: 'Completado', icon: <CheckCircle2 className="mr-2 h-4 w-4" /> },
  dropped: { label: 'Abandonado', icon: <XCircle className="mr-2 h-4 w-4" /> },
};

export default function GameCard({ game, currentStatus, isReadOnly = false }: GameCardProps) {
  const { moveGame, removeGame, updateGame } = useGameStore();
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [gameDetails, setGameDetails] = useState<Game | null>(null);

  const otherStatuses = (Object.keys(statusConfig) as GameStatus[]).filter(s => s !== currentStatus);

  const onOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen) {
        setGameDetails(game); // show current game data immediately
        
        const detailsPromise = game.summary 
            ? Promise.resolve(game) 
            : getGameDetails(game.id);
        
        if (!game.summary) setIsLoading(true);

        detailsPromise.then(fullDetails => {
            if (fullDetails) {
                if(!game.summary) {
                   updateGame(fullDetails, currentStatus);
                }
                setGameDetails(fullDetails);
            }
        }).finally(() => {
            if(!game.summary) setIsLoading(false);
        });

    } else {
        // Reset state on close
        setGameDetails(null);
    }
  };

  const displayedSummary = gameDetails?.summary || game.summary;
  const truncatedSummary = displayedSummary ? (displayedSummary.length > 400 ? `${displayedSummary.substring(0, 400)}...` : displayedSummary) : 'No hay descripción disponible';


  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <Card className="overflow-hidden">
        <div className="flex items-start gap-4 p-4">
          <DialogTrigger asChild>
            <div className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer">
                <div className="flex-shrink-0">
                    <Image
                        src={game.coverImage || 'https://placehold.co/45x60.png'}
                        alt={`${game.name} cover art`}
                        width={45}
                        height={60}
                        className="rounded-sm object-cover"
                        data-ai-hint="game poster"
                    />
                </div>
                <div className="flex-1 min-w-0">
                    <h3 className="font-bold font-headline truncate">{game.name}</h3>
                    {isLoading && !displayedSummary ? (
                         <p className="text-sm text-muted-foreground mt-1 italic">Cargando...</p>
                    ) : displayedSummary ? (
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{displayedSummary}</p>
                    ): (
                        <p className="text-sm text-muted-foreground mt-1 italic">No hay descripción disponible</p>
                    )}
                </div>
            </div>
          </DialogTrigger>
          {!isReadOnly && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="flex-shrink-0">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Mover a...</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {otherStatuses.map((status) => (
                  <DropdownMenuItem key={status} onClick={() => moveGame(game, currentStatus, status)}>
                    {statusConfig[status].icon}
                    <span>{statusConfig[status].label}</span>
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive focus:bg-destructive/10 focus:text-destructive" onClick={() => removeGame(game.id, currentStatus)}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  <span>Eliminar</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </Card>
      <DialogContent className="w-[95vw] max-w-2xl p-0 flex flex-col max-h-[90vh] sm:max-h-none">
        <DialogHeader className="p-6 pb-4 flex-shrink-0">
          <DialogTitle className="font-headline text-2xl">{game.name}</DialogTitle>
        </DialogHeader>
        <div className="flex-grow overflow-y-auto sm:overflow-y-visible px-6 pb-6 scrollbar-hide">
            <div className="flex flex-col sm:flex-row gap-6">
              <div className="sm:w-1/3 flex-shrink-0">
                <Image
                  src={gameDetails?.coverImage || game.coverImage || 'https://placehold.co/600x800.png'}
                  alt={`${game.name} cover art`}
                  width={600}
                  height={800}
                  className="rounded-md object-cover w-full"
                  data-ai-hint="game poster"
                />
              </div>
              <div className="sm:w-2/3 space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Descripción</h4>
                  <div className="text-sm text-muted-foreground">
                    {isLoading && !displayedSummary ? (
                      <p>Cargando...</p>
                    ) : (
                      <p>{truncatedSummary}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
