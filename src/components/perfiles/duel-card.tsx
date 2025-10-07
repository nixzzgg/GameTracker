"use client";

import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useGameStore } from '@/hooks/use-game-store';
import { getAdnGamer } from '@/ai/flows/adn-gamer';
import { getGamerDuel, type GamerDuelOutput } from '@/ai/flows/gamer-duel-flow';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Users, Loader2, ThumbsUp, ThumbsDown, Gamepad2, AlertTriangle } from 'lucide-react';
import type { User } from '@/lib/types';
import type { GameState } from '@/hooks/use-game-store';

interface DuelCardProps {
    viewedUser: User;
    viewedUserLists: GameState;
}

export default function DuelCard({ viewedUser, viewedUserLists }: DuelCardProps) {
    const { user: currentUser } = useAuth();
    const { state: currentUserListsState } = useGameStore();
    const isCurrentUserListsLoaded = currentUserListsState.isLoaded;

    const [open, setOpen] = useState(false);
    const [isComparing, setIsComparing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [duelResult, setDuelResult] = useState<GamerDuelOutput | null>(null);

    const handleCompare = async () => {
        if (!currentUser || !isCurrentUserListsLoaded) return;
        setIsComparing(true);
        setError(null);
        setDuelResult(null);

        try {
            const currentUserHasGames = currentUserListsState.completed.length > 0 || currentUserListsState.playing.length > 0;
            const viewedUserHasGames = viewedUserLists.completed.length > 0 || viewedUserLists.playing.length > 0;

            if (!currentUserHasGames || !viewedUserHasGames) {
                setError('Uno o ambos usuarios no tienen suficientes juegos para generar un ADN Gamer y poder comparar');
                setIsComparing(false);
                return;
            }

            const [currentUserDna, viewedUserDna] = await Promise.all([
                getAdnGamer({
                    completedGames: currentUserListsState.completed.map(g => g.name),
                    playingGames: currentUserListsState.playing.map(g => g.name),
                    droppedGames: currentUserListsState.dropped.map(g => g.name),
                    wishlistGames: currentUserListsState.wishlist.map(g => g.name),
                }),
                getAdnGamer({
                    completedGames: viewedUserLists.completed.map(g => g.name),
                    playingGames: viewedUserLists.playing.map(g => g.name),
                    droppedGames: viewedUserLists.dropped.map(g => g.name),
                    wishlistGames: viewedUserLists.wishlist.map(g => g.name),
                })
            ]);

            const duel = await getGamerDuel({
                user1Name: currentUser.username,
                user1Dna: currentUserDna,
                user2Name: viewedUser.username,
                user2Dna: viewedUserDna,
            });

            setDuelResult(duel);
        } catch (e) {
            console.error("Failed to compare profiles:", e);
            setError("Hubo un error al comparar los perfiles. Por favor, inténtalo de nuevo");
        } finally {
            setIsComparing(false);
        }
    };

    const handleOpenChange = (isOpen: boolean) => {
        setOpen(isOpen);
        if (!isOpen) {
            setIsComparing(false);
            setError(null);
            setDuelResult(null);
        }
    };
    
    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <Card className="rounded-xl sm:rounded-lg">
                <CardHeader className="p-4 md:p-6">
                    <CardTitle className="font-headline text-xl md:text-2xl">Análisis IA</CardTitle>
                    <CardDescription>Compara tu perfil con el de {viewedUser.username}</CardDescription>
                </CardHeader>
                <CardContent className="p-4 pt-0 md:p-6 md:pt-0">
                    <DialogTrigger asChild>
                        <Button className="w-full" onClick={handleCompare}>
                            <Users className="mr-2 h-4 w-4" />
                            Comparar perfiles
                        </Button>
                    </DialogTrigger>
                </CardContent>
            </Card>

            <DialogContent className="max-w-xs sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-center font-headline text-xl sm:text-2xl">
                         {isComparing && 'Analizando...'}
                         {error && <span className="text-muted-foreground">Error</span>}
                         {duelResult && 'Resultados'}
                    </DialogTitle>
                </DialogHeader>

                {isComparing && (
                    <div className="flex flex-col items-center justify-center text-center text-muted-foreground p-6 sm:p-8">
                        <Loader2 className="h-10 w-10 sm:h-12 sm:w-12 animate-spin text-primary mb-4" />
                        <p className="text-sm sm:text-base">La IA está comparando sus gustos...</p>
                    </div>
                )}
                {error && (
                    <div className="flex flex-col items-center justify-center text-center text-muted-foreground p-6 sm:p-8 bg-muted/10 rounded-md">
                        <AlertTriangle className="h-10 w-10 sm:h-12 sm:w-12 mb-4" />
                        <p className="text-sm sm:text-base">{error}</p>
                    </div>
                )}
                {duelResult && (
                    <div className="space-y-4 sm:space-y-6 pt-2 sm:pt-4">
                        <div className="space-y-2 sm:space-y-3">
                            <h4 className="font-semibold flex items-center gap-2 text-sm sm:text-base"><ThumbsUp className="h-4 w-4 sm:h-5 sm:w-5 text-green-500" /> Coincidencias</h4>
                            <ul className="list-disc list-inside text-xs sm:text-sm text-muted-foreground space-y-1">
                                {duelResult.similarities.map((item, i) => <li key={i}>{item}</li>)}
                            </ul>
                        </div>
                        <div className="space-y-2 sm:space-y-3">
                            <h4 className="font-semibold flex items-center gap-2 text-sm sm:text-base"><ThumbsDown className="h-4 w-4 sm:h-5 sm:w-5 text-red-500" /> Diferencias</h4>
                            <ul className="list-disc list-inside text-xs sm:text-sm text-muted-foreground space-y-1">
                                {duelResult.differences.map((item, i) => <li key={i}>{item}</li>)}
                            </ul>
                        </div>
                        <div className="space-y-2 sm:space-y-3">
                            <h4 className="font-semibold flex items-center gap-2 text-sm sm:text-base"><Gamepad2 className="h-4 w-4 sm:h-5 sm:w-5 text-primary" /> Juegos COOP</h4>
                            <ul className="list-disc list-inside text-xs sm:text-sm text-muted-foreground space-y-1">
                                 {duelResult.coopRecommendations.map((item, i) => <li key={i}><strong>{item}</strong></li>)}
                            </ul>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}