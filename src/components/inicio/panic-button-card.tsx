
"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import type { Game } from '@/lib/types';
import { Loader2, AlertTriangle, Siren, Rocket } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { fetchPanicButtonSuggestion } from '@/app/(app)/inicio/actions';
import AddGameCard from '@/components/search/add-game-card';
import { useGameStore } from '@/hooks/use-game-store';
import { useToast } from '@/hooks/use-toast';

interface Suggestion {
    game: Game;
    microTask: string;
}

export default function PanicButtonCard() {
    const { user } = useAuth();
    const { state: gameState } = useGameStore();
    const { toast } = useToast();
    const [suggestion, setSuggestion] = useState<Suggestion | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isFadingOut, setIsFadingOut] = useState(false);

    const hasGames = gameState.isLoaded && gameState.playing.length > 0;

    useEffect(() => {
        if (!suggestion) return;

        const timer = setTimeout(() => {
            setIsFadingOut(true);
            const fadeTimer = setTimeout(() => {
                setSuggestion(null);
            }, 500); // Animation duration
            
            return () => clearTimeout(fadeTimer);
        }, 15000); // 15 seconds

        return () => clearTimeout(timer);
    }, [suggestion]);


    const getSuggestion = async () => {
        if (!user) return;
        
        if (!hasGames) {
            toast({
                title: 'No hay juegos elegibles',
                description: "Añade juegos a tu lista de 'Jugando' para usar esta función.",
            });
            return;
        }

        setIsLoading(true);
        setError(null);
        setSuggestion(null);
        setIsFadingOut(false);

        const result = await fetchPanicButtonSuggestion(user.id);
        
        if (result.error) {
            setError(result.error);
        } else if (result.suggestion) {
            setSuggestion(result.suggestion);
        } else {
            setError("La IA no pudo tomar una decisión. Parece que hoy te libras.");
        }
        setIsLoading(false);
    };

    const renderContent = () => {
        if (isLoading) {
            return (
                <div className="flex flex-col items-center justify-center text-center text-muted-foreground p-4 min-h-[160px]">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="mt-2 font-semibold font-headline">Recibiendo órdenes...</p>
                </div>
            );
        }

        if (error) {
            return (
                 <div className="flex flex-col items-center justify-center text-center text-muted-foreground p-4 min-h-[160px]">
                    <AlertTriangle className="h-8 w-8 mb-2" />
                    <p className="font-semibold">{error}</p>
                </div>
            );
        }
        
        if (suggestion) {
            return (
                <div className={`flex flex-col items-center gap-4 p-4 transition-opacity duration-500 ease-in-out ${isFadingOut ? 'opacity-0' : 'opacity-100'}`}>
                    <div className="w-full max-w-[150px] md:max-w-[180px]">
                        <AddGameCard game={suggestion.game} />
                    </div>
                    <Card className="w-full bg-primary/10 border-primary/20">
                        <CardHeader className="p-3 pb-2">
                             <CardTitle className="text-base font-headline flex items-center gap-2">
                                <Rocket className="h-4 w-4 text-primary" />
                                Misión Inmediata
                             </CardTitle>
                        </CardHeader>
                        <CardContent className="p-3 pt-0">
                           <p className="text-center text-sm font-semibold text-primary italic">&quot;{suggestion.microTask}&quot;</p>
                        </CardContent>
                    </Card>
                </div>
            );
        }
        
        // Initial state
        return (
             <div className="flex flex-col items-center justify-center p-4 min-h-[160px]">
                <Siren className="h-12 w-12 text-muted-foreground/30" />
            </div>
        );
    };


    return (
        <Card className="mt-4 flex flex-col h-full min-h-[358px]">
             <CardContent className="p-4 flex-grow flex items-center justify-center">
                {renderContent()}
            </CardContent>
            <CardFooter className="p-4 pt-0">
                 <Button onClick={getSuggestion} disabled={isLoading} className="w-full h-12 shadow-lg text-lg font-bold">
                    BOTÓN DEL PÁNICO
                </Button>
            </CardFooter>
        </Card>
    );
}
