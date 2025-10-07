
"use client";

import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useGameStore } from '@/hooks/use-game-store';
import type { Game } from '@/lib/types';
import { Loader2, Lightbulb, Puzzle, Wand2, ShieldAlert, Coffee, Sparkles, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { fetchDynamicSuggestion } from '@/app/(app)/inicio/actions';
import AddGameCard from '@/components/search/add-game-card';
import { useToast } from '@/hooks/use-toast';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

interface Suggestion {
    game: Game;
    reasoning: string;
}

function getTimeOfDay() {
    const hour = new Date().getHours();
    if (hour >= 0 && hour < 6) return 'madrugada';
    if (hour >= 6 && hour < 12) return 'mañana';
    if (hour >= 12 && hour < 19) return 'tarde';
    return 'noche';
}

const contextOptions = [
    { key: 'short', label: 'Sesión corta', icon: Puzzle, contextValue: 'Sesión corta' as string | null },
    { key: 'long', label: 'Aventura larga', icon: Wand2, contextValue: 'Aventura larga' as string | null },
    { key: 'challenge', label: 'Quiero un reto', icon: ShieldAlert, contextValue: 'Quiero un reto' as string | null },
    { key: 'relax', label: 'Para relajarme', icon: Coffee, contextValue: 'Para relajarme' as string | null },
    { key: 'surprise', label: 'Sorpréndeme', icon: Sparkles, contextValue: null as string | null },
];

const SUGGESTION_CACHE_KEY = 'gametracker_suggestion_cache';

export default function SugerenciaCard() {
    const { user } = useAuth();
    const { state: gameState } = useGameStore();
    const { toast } = useToast();
    const [suggestion, setSuggestion] = useState<Suggestion | null>(null);
    const [activeGame, setActiveGame] = useState<Game | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isFadingOut, setIsFadingOut] = useState(false);
    const [isInitialLoad, setIsInitialLoad] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const cleanupPendingRef = useRef(false);

    const cacheKey = useMemo(() => user ? `${SUGGESTION_CACHE_KEY}_${user.id}` : null, [user]);

    const startCleanup = useCallback(() => {
        setIsFadingOut(true);
        const fadeTimer = setTimeout(() => {
            setSuggestion(null);
            setActiveGame(null);
            if (cacheKey) {
                localStorage.removeItem(cacheKey);
            }
            cleanupPendingRef.current = false;
        }, 500); // Wait for fade-out to complete
        return () => clearTimeout(fadeTimer);
    }, [cacheKey]);


    useEffect(() => {
        if (!cacheKey) return;

        try {
            const cachedData = localStorage.getItem(cacheKey);
            if (cachedData) {
                const parsedSuggestion: Suggestion = JSON.parse(cachedData);
                setSuggestion(parsedSuggestion);
                setActiveGame(parsedSuggestion.game);
            }
        } catch (e) {
            console.error("Failed to read suggestion from cache", e);
        } finally {
            setIsInitialLoad(false);
        }
    }, [cacheKey]);
    
    // This effect handles the auto-cleanup after 15 seconds
    useEffect(() => {
        if (!suggestion) return;

        const timer = setTimeout(() => {
            if (isDialogOpen) {
                // If dialog is open, flag that we need to clean up when it closes
                cleanupPendingRef.current = true;
            } else {
                // Otherwise, start the cleanup process immediately
                startCleanup();
            }
        }, 15000);

        return () => clearTimeout(timer);
    }, [suggestion, isDialogOpen, startCleanup]);

    // This effect handles the cleanup after the dialog is closed
    useEffect(() => {
        if (!isDialogOpen && cleanupPendingRef.current) {
            startCleanup();
        }
    }, [isDialogOpen, startCleanup]);

    const hasGames = useMemo(() => {
        if (!gameState.isLoaded) return false;
        return gameState.completed.length > 0 || gameState.playing.length > 0 || gameState.dropped.length > 0 || gameState.wishlist.length > 0;
    }, [gameState]);


    const getSuggestion = useCallback(async (context: string | null) => {
        if (!user || !cacheKey) return;
        
        if (!hasGames) {
            toast({
                title: 'No tienes juegos',
                description: 'Añade juegos a tus listas para que la IA pueda darte sugerencias.',
            });
            return;
        }

        setIsLoading(true);
        setError(null);
        setSuggestion(null);
        setActiveGame(null);
        setIsFadingOut(false);
        cleanupPendingRef.current = false;
        
        const timeOfDay = getTimeOfDay();
        const result = await fetchDynamicSuggestion(user.id, timeOfDay, context || undefined);

        if (result.error) {
            setError(result.error);
            localStorage.removeItem(cacheKey);
        } else if (result.suggestion) {
            setSuggestion(result.suggestion);
            setActiveGame(result.suggestion.game);
            try {
                localStorage.setItem(cacheKey, JSON.stringify(result.suggestion));
            } catch (e) {
                console.error("Failed to save suggestion to cache", e);
            }
        } else {
            setError("La IA no pudo encontrar una sugerencia. Intenta de nuevo.");
            localStorage.removeItem(cacheKey);
        }
        setIsLoading(false);

    }, [user, hasGames, toast, cacheKey]);
    
    const renderContent = () => {
        if (isInitialLoad && !activeGame) {
            return (
                <div className="flex flex-col items-center justify-center text-center text-muted-foreground p-4 min-h-[120px]">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
            )
        }

        if (isLoading) {
            return (
                <div className="flex flex-col items-center justify-center text-center text-muted-foreground p-4 pt-4 min-h-[120px]">
                    <Loader2 className="h-12 w-12 animate-spin text-primary mb-2" />
                    <h3 className="text-sm font-semibold font-headline">Generando sugerencia...</h3>
                    <p className="mt-1 text-xs">La IA está pensando...</p>
                </div>
            );
        }
        
        if (error) {
             return (
                 <div className="text-center py-10 text-muted-foreground">{error}</div>
            );
        }
        
        if (!activeGame) {
             return (
                <div className="flex flex-col items-center justify-start text-center text-muted-foreground p-4 pt-4 min-h-[120px]">
                    <Lightbulb className="h-8 w-8 text-muted-foreground/50 mb-2" />
                    <h3 className="text-sm font-semibold font-headline">Sin ideas?</h3>
                    <p className="mt-1 text-xs">Pide una sugerencia express a la IA</p>
                </div>
            );
        }
        
        return (
             <div className={`flex flex-col items-center gap-6 py-2 transition-opacity duration-500 ease-in-out ${!isFadingOut ? 'opacity-100' : 'opacity-0'}`}>
                <div className="min-h-[40px] px-4 w-full">
                    {suggestion && (
                        <Card className="bg-primary/10 border-primary/20 max-w-lg mx-auto">
                            <CardContent className="p-2 text-center">
                                <p className="text-xs italic text-primary font-medium">&quot;{suggestion.reasoning}&quot;</p>
                            </CardContent>
                        </Card>
                    )}
                </div>
                <div className="w-full max-w-[130px] md:max-w-[150px]">
                     <AddGameCard game={activeGame} onDialogOpenChange={setIsDialogOpen} />
                </div>
            </div>
        )
    }

    return (
        <Card className="mt-4">
            <CardContent className="space-y-2 p-4">
                {/* Desktop buttons */}
                <div className="hidden md:flex flex-wrap items-center justify-center gap-1.5">
                    {contextOptions.map(opt => {
                        const Icon = opt.icon;
                        return (
                            <Button key={opt.key} variant="outline" size="sm" className="text-xs h-7 text-muted-foreground" onClick={() => getSuggestion(opt.contextValue)} disabled={isLoading}>
                                <Icon className="mr-1.5 h-3 w-3"/>
                                {opt.label}
                            </Button>
                        )
                    })}
                </div>

                {/* Mobile dropdown */}
                <div className="block md:hidden">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="w-full justify-between text-muted-foreground" disabled={isLoading}>
                                <span>Pide una sugerencia...</span>
                                <ChevronDown className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="center" className="w-[calc(100vw-5rem)]">
                            {contextOptions.map(opt => {
                                const Icon = opt.icon;
                                return (
                                    <DropdownMenuItem
                                        key={opt.key}
                                        onClick={() => getSuggestion(opt.contextValue)}
                                        disabled={isLoading}
                                        className="text-muted-foreground focus:text-accent-foreground"
                                    >
                                        <Icon className="mr-2 h-4 w-4" />
                                        <span>{opt.label}</span>
                                    </DropdownMenuItem>
                                )
                            })}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                <div className="pt-1">
                    {renderContent()}
                </div>
            </CardContent>
        </Card>
    )
}
