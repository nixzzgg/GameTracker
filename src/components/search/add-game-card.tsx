
"use client";

import Image from 'next/image';
import { Plus, CheckCircle2, PlayCircle, Heart, XCircle } from 'lucide-react';
import type { Game, GameStatus } from '@/lib/types';
import { useGameStore } from '@/hooks/use-game-store';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { getGameDetails } from '@/app/(app)/search/actions';
import { useState } from 'react';

interface AddGameCardProps {
  game: Game;
  onDialogOpenChange?: (isOpen: boolean) => void;
}

const statusTranslations: { [key in GameStatus]: string } = {
  completed: 'completados',
  playing: 'jugando',
  wishlist: 'wishlist',
  dropped: 'abandonados',
};

const statusConfig: { [key in GameStatus]: { label: string; icon: React.ReactNode } } = {
    completed: { label: 'Completado', icon: <CheckCircle2 className="mr-2 h-4 w-4" /> },
    playing: { label: 'Jugando', icon: <PlayCircle className="mr-2 h-4 w-4" /> },
    wishlist: { label: 'Wishlist', icon: <Heart className="mr-2 h-4 w-4" /> },
    dropped: { label: 'Abandonado', icon: <XCircle className="mr-2 h-4 w-4" /> },
};

export default function AddGameCard({ game, onDialogOpenChange }: AddGameCardProps) {
  const { addGame, state } = useGameStore();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [details, setDetails] = useState<Game | null>(null);
  const [isLoading, setIsLoading] = useState(false);


  const allGames = [...state.playing, ...state.completed, ...state.dropped, ...state.wishlist];
  const isAdded = allGames.some(g => g.id === game.id);

  const handleAdd = (status: GameStatus) => {
    const gameToAdd = details || game;
    addGame(gameToAdd, status);
    toast({
      title: 'Juego añadido',
      description: `${game.name} fue añadido a tu lista de ${statusTranslations[status]}`,
    });
    setOpen(false);
  };

  const onOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    onDialogOpenChange?.(isOpen);
    if (isOpen && !details) {
      setIsLoading(true);
      getGameDetails(game.id)
        .then((fullDetails) => {
          if (fullDetails) {
            setDetails(fullDetails);
          } else {
            const fallbackDetails = { ...game, summary: game.summary || 'No hay descripción disponible' };
            setDetails(fallbackDetails);
          }
        })
        .finally(() => setIsLoading(false));
    }
  };
  
  const summaryText = details?.summary || 'No hay descripción disponible.';
  const truncatedSummary = summaryText.length > 400 ? `${summaryText.substring(0, 400)}...` : summaryText;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild className="h-full w-full">
        <Card className="overflow-hidden group relative transition-shadow duration-300 cursor-pointer h-full flex flex-col">
          <CardContent className="p-0 flex-grow">
            <div className="relative h-full">
              <Image
                src={game.coverImage || 'https://placehold.co/600x800.png'}
                alt={`${game.name} cover`}
                width={600}
                height={800}
                className="w-full h-full object-cover aspect-[3/4]"
                data-ai-hint="game poster"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              <div className="absolute bottom-0 left-0 p-4">
                <h3 className="font-bold text-white font-headline drop-shadow-md">{game.name}</h3>
              </div>
            </div>
          </CardContent>
        </Card>
      </DialogTrigger>
      <DialogContent className="w-[95vw] max-w-2xl p-0 flex flex-col max-h-[90vh] sm:max-h-none">
        <DialogHeader className="p-6 pb-4 flex-shrink-0">
          <DialogTitle className="font-headline text-2xl">{game.name}</DialogTitle>
        </DialogHeader>
        <div className="flex-grow overflow-y-auto sm:overflow-y-visible px-6 scrollbar-hide">
            <div className="flex flex-col sm:flex-row gap-6">
              <div className="sm:w-1/3 flex-shrink-0">
                <Image
                  src={details?.coverImage || game.coverImage || 'https://placehold.co/600x800.png'}
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
                      {isLoading ? <p>Cargando...</p> : <p>{truncatedSummary}</p>}
                  </div>
                </div>
              </div>
            </div>
        </div>
        <DialogFooter className="p-6 pt-4 flex-shrink-0">
            {isAdded ? (
            <Button disabled variant="secondary" className="w-full sm:w-auto">Añadido a la lista</Button>
          ) : (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button className="w-full sm:w-auto">
                  <Plus className="mr-2 h-4 w-4" />
                  Añadir a la lista
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuLabel>Añadir a la lista</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => handleAdd('completed')}>
                    {statusConfig.completed.icon}
                    <span>{statusConfig.completed.label}</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleAdd('playing')}>
                    {statusConfig.playing.icon}
                    <span>{statusConfig.playing.label}</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleAdd('wishlist')}>
                    {statusConfig.wishlist.icon}
                    <span>{statusConfig.wishlist.label}</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleAdd('dropped')}>
                    {statusConfig.dropped.icon}
                    <span>{statusConfig.dropped.label}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
