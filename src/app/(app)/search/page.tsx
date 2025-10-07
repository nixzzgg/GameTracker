
"use client";

import { useSearchParams } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import AddGameCard from '@/components/search/add-game-card';
import SearchBar from '@/components/search-bar';
import { searchGames } from './actions';
import type { Game } from '@/lib/types';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function SearchPage() {
    const searchParams = useSearchParams();
    const query = searchParams.get('q') || '';

    const [results, setResults] = useState<Game[]>([]);
    const [page, setPage] = useState(1);
    const [nextPage, setNextPage] = useState<number | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchGames = useCallback(async (q: string, pageNum: number) => {
        if (!q) {
            setResults([]);
            setIsLoading(false);
            return;
        };

        if (pageNum === 1) setIsLoading(true);
        else setIsLoadingMore(true);
        setError(null);

        try {
            const result = await searchGames(q, pageNum);
            if (result.error) {
                setError(result.error);
                if (pageNum === 1) setResults([]);
            } else if (result.games) {
                setResults(prev => pageNum === 1 ? result.games! : [...prev, ...result.games!]);
                setNextPage(result.nextPage || null);
            }
        } catch (e) {
            setError('Ocurrió un error inesperado al buscar juegos');
        } finally {
            if (pageNum === 1) setIsLoading(false);
            else setIsLoadingMore(false);
        }
    }, []);

    useEffect(() => {
        setPage(1);
        setResults([]);
        setNextPage(null);
        if (query) {
            fetchGames(query, 1);
        } else {
            setIsLoading(false);
        }
    }, [query, fetchGames]);

    const handleLoadMore = () => {
        if (nextPage) {
            setPage(nextPage);
            fetchGames(query, nextPage);
        }
    };

    return (
        <div className="p-4 md:p-6">
             <header className="mb-6">
                <h1 className="text-3xl font-bold font-headline text-primary">Buscador</h1>
                <p className="text-muted-foreground mt-1">Busca tus juegos en el buscador</p>
                <div className="mt-4">
                    <SearchBar />
                </div>
            </header>

            {query && (
                 <>
                    <h2 className="text-2xl font-bold font-headline mb-6">
                        Resultados
                    </h2>

                    {isLoading ? (
                        <div className="flex justify-center items-center py-24">
                            <div className="flex flex-col items-center gap-4 text-muted-foreground">
                                <Loader2 className="h-20 w-20 animate-spin text-primary" />
                                <p className="font-semibold font-headline">Buscando juegos...</p>
                            </div>
                        </div>
                    ) : error ? (
                        <div className="text-center py-16">
                            <p className="text-muted-foreground">{error}</p>
                        </div>
                    ) : results.length === 0 ? (
                        <div className="text-center py-16">
                            <p className="text-muted-foreground">No se encontraron resultados para &quot;{query}&quot;</p>
                        </div>
                    ) : (
                        <>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 md:gap-6">
                                {results.map(game => (
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
                </>
            )}
        </div>
    );
}
