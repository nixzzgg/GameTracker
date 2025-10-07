"use client";

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import AddGameCard from '@/components/search/add-game-card';
import { getGamesByGenre, getGenres } from '@/app/(app)/search/actions';
import type { Game, Genre } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Loader2, ChevronLeft } from 'lucide-react';
import Link from 'next/link';

const GENRES_CACHE_KEY = 'gametracker_genres_cache';
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour

export default function GenrePage() {
    const params = useParams();
    const slug = params.slug as string;
    
    const [games, setGames] = useState<Game[]>([]);
    const [genreName, setGenreName] = useState("");
    const [page, setPage] = useState(1);
    const [nextPage, setNextPage] = useState<number | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (slug) {
            setGenreName(slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()));
        }
    }, [slug]);

    const fetchGenreName = useCallback(async () => {
        if (!slug) return;
        try {
            const cachedData = localStorage.getItem(GENRES_CACHE_KEY);
            if (cachedData) {
                const { genres: cachedGenres, timestamp } = JSON.parse(cachedData);
                if (Date.now() - timestamp < CACHE_DURATION) {
                    const currentGenre = cachedGenres.find((g: Genre) => g.slug === slug);
                    if (currentGenre) {
                        setGenreName(currentGenre.name);
                        return;
                    }
                }
            }
        } catch (e) {
            console.error("Failed to read genres from cache", e);
        }

        const result = await getGenres();
        if (result.genres) {
            const currentGenre = result.genres.find((g: Genre) => g.slug === slug);
            if (currentGenre) {
                setGenreName(currentGenre.name);
            }
        }
    }, [slug]);

    useEffect(() => {
        if(slug) {
            fetchGenreName();
        }
    }, [slug, fetchGenreName]);

    const fetchGames = useCallback(async (pageNum: number) => {
        if (!slug) return;
        if (pageNum === 1) setIsLoading(true);
        else setIsLoadingMore(true);
        setError(null);

        try {
            const result = await getGamesByGenre(slug, pageNum);
            if (result.error) {
                setError(result.error);
                if (pageNum === 1) setGames([]);
            } else if (result.games) {
                setGames(prev => pageNum === 1 ? result.games! : [...prev, ...result.games!]);
                setNextPage(result.nextPage || null);
            }
        } catch (e) {
            setError('Ocurrió un error inesperado al buscar juegos');
        } finally {
            if (pageNum === 1) setIsLoading(false);
            else setIsLoadingMore(false);
        }
    }, [slug]);

    useEffect(() => {
        if (slug) {
            fetchGames(1);
        }
    }, [slug, fetchGames]);

    const handleLoadMore = () => {
        if (nextPage) {
            setPage(nextPage);
            fetchGames(nextPage);
        }
    };

    if (!slug) {
        return (
            <div className="flex justify-center items-center py-24">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
        )
    }

    return (
        <div className="p-4 md:p-6">
            <header className="mb-6">
                <Link href="/explorar" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4">
                    <ChevronLeft className="h-4 w-4" />
                    Volver a explorar
                </Link>
                <h1 className="text-3xl font-bold font-headline text-primary">{genreName}</h1>
                <p className="text-muted-foreground mt-1">Explora más juegos en esta categoría</p>
            </header>

            {isLoading ? (
                <div className="flex justify-center items-center py-24">
                    <Loader2 className="h-12 w-12 animate-spin text-primary" />
                </div>
            ) : error ? (
                <div className="text-center py-16">
                    <p className="text-muted-foreground">{error}</p>
                </div>
            ) : games.length === 0 ? (
                <div className="text-center py-16">
                    <p className="text-muted-foreground">No se encontraron juegos para esta categoría</p>
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
                        {games.map(game => (
                            <AddGameCard key={game.id} game={{...game, coverImage: game.coverImage || `https://placehold.co/600x800.png`}} />
                        ))}
                    </div>
                    {nextPage && (
                        <div className="mt-8 text-center">
                            <Button onClick={handleLoadMore} disabled={isLoadingMore}>
                                {isLoadingMore ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Cargando
                                    </>
                                ) : (
                                    'Cargar más juegos'
                                )}
                            </Button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
