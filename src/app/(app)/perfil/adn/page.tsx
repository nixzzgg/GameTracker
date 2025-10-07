
"use client";

import { useEffect, useState } from 'react';
import { useGameStore } from '@/hooks/use-game-store';
import { getAdnGamer, type AdnGamerOutput } from '@/ai/flows/adn-gamer';
import { getDroppedGamesAnalysis, type DroppedGamesAnalysisOutput } from '@/ai/flows/dropped-games-analysis-flow';
import AdnProfile from '@/components/perfil/adn-profile';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dna, Loader2, AlertTriangle, Gamepad2, SearchX } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function AdnGamerPage() {
    const { state } = useGameStore();
    const [dna, setDna] = useState<AdnGamerOutput | null>(null);
    const [droppedAnalysis, setDroppedAnalysis] = useState<DroppedGamesAnalysisOutput | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    const hasGamesForDna = state.completed.length > 0 || state.playing.length > 0;
    const hasDroppedGames = state.dropped.length > 0;

    useEffect(() => {
        if (!state.isLoaded) return;
        
        if (!hasGamesForDna && !hasDroppedGames) {
            setIsLoading(false);
            return;
        }

        const fetchAnalysis = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const promises = [];
                if (hasGamesForDna) {
                    const dnaInput = {
                        completedGames: state.completed.map(g => g.name),
                        playingGames: state.playing.map(g => g.name),
                        droppedGames: state.dropped.map(g => g.name),
                        wishlistGames: state.wishlist.map(g => g.name),
                    };
                    promises.push(getAdnGamer(dnaInput));
                } else {
                    promises.push(Promise.resolve(null));
                }

                if (hasDroppedGames) {
                    const droppedInput = {
                        droppedGames: state.dropped.map(g => g.name),
                    };
                    promises.push(getDroppedGamesAnalysis(droppedInput));
                } else {
                    promises.push(Promise.resolve(null));
                }
                
                const [dnaResult, droppedResult] = await Promise.all(promises);

                if (dnaResult) setDna(dnaResult);
                if (droppedResult) setDroppedAnalysis(droppedResult);

            } catch (e) {
                console.error("Failed to generate analysis:", e);
                setError("Hubo un error al generar tu análisis. Por favor, inténtalo de nuevo más tarde");
            } finally {
                setIsLoading(false);
            }
        };

        fetchAnalysis();
    }, [state.isLoaded, hasGamesForDna, hasDroppedGames, state.completed, state.playing, state.dropped, state.wishlist]);
    
    const renderContent = () => {
        if (isLoading) {
            return (
                <div className="flex flex-col items-center justify-center text-center text-muted-foreground p-8 rounded-lg min-h-[400px]">
                    <Loader2 className="h-16 w-16 animate-spin text-primary mb-4" />
                    <h3 className="text-xl font-semibold font-headline">Analizando tu perfil</h3>
                    <p className="mt-2">Estamos procesando tus gustos...</p>
                </div>
            );
        }

        if (error) {
            return (
                <div className="flex flex-col items-center justify-center text-center text-muted-foreground bg-muted/80 p-8 rounded-lg min-h-[400px]">
                    <AlertTriangle className="h-16 w-16 mb-4" />
                    <h3 className="text-xl font-semibold font-headline">Ocurrió un error</h3>
                    <p className="mt-2">{error}</p>
                </div>
            );
        }

        if (!hasGamesForDna && !hasDroppedGames) {
             return (
                <div className="flex flex-col items-center justify-center text-center text-muted-foreground p-8 rounded-lg min-h-[400px]">
                    <Gamepad2 className="h-16 w-16 text-muted-foreground/50 mb-4" />
                    <h3 className="text-xl font-semibold font-headline">No hay suficientes datos</h3>
                    <p className="mt-2">Juega o completa algunos juegos para que podamos analizar tu perfil</p>
                    <Button asChild className="mt-4">
                        <Link href="/inicio">Buscar juegos</Link>
                    </Button>
                </div>
            );
        }

        return (
            <div className="space-y-8">
                {dna && <AdnProfile dna={dna} />}
                
                {droppedAnalysis && droppedAnalysis.summary && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 font-headline">
                                Análisis de juegos abandonados
                            </CardTitle>
                            <CardDescription>Aprendiendo de los juegos que no terminaste</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <p className="text-muted-foreground italic">&quot;{droppedAnalysis.summary}&quot;</p>
                            <div>
                                <h4 className="font-semibold mb-2">Patrones comunes detectados</h4>
                                <div className="flex flex-wrap gap-2">
                                    {droppedAnalysis.commonPatterns.map(pattern => (
                                        <Badge key={pattern} variant="destructive">{pattern}</Badge>
                                    ))}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        )
    };

    return (
        <div className="p-4 md:p-6 space-y-6">
            <header className="flex items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold font-headline text-primary">Tu ADN Gamer</h1>
                    <p className="text-muted-foreground mt-1">Un análisis de IA sobre tus gustos en videojuegos</p>
                </div>
            </header>
            
            {renderContent()}

        </div>
    );
}
