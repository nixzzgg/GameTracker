"use client";

import { useEffect, useState, useCallback } from 'react';
import type { Genre } from '@/lib/types';
import { getGenres } from '@/app/(app)/search/actions';
import GenreRow from '@/components/explorar/genre-row';

const GENRES_CACHE_KEY = 'gametracker_genres_cache';
const CACHE_DURATION = 60 * 60 * 1000; 

export default function ExplorarPage() {
    const [genres, setGenres] = useState<Genre[]>([]);
    const [error, setError] = useState<string | null>(null);

    const fetchGenres = useCallback(async () => {
        setError(null);

        try {
            const cachedData = localStorage.getItem(GENRES_CACHE_KEY);
            if (cachedData) {
                const { genres: cachedGenres, timestamp } = JSON.parse(cachedData);
                if (Date.now() - timestamp < CACHE_DURATION) {
                    setGenres(cachedGenres);
                    return;
                }
            }
        } catch (e) {
            console.error("Failed to read genres from cache", e);
        }
        
        const result = await getGenres();
        if (result.error) {
            setError(result.error);
        } else if (result.genres) {
            setGenres(result.genres);
            try {
                const cachePayload = { genres: result.genres, timestamp: Date.now() };
                localStorage.setItem(GENRES_CACHE_KEY, JSON.stringify(cachePayload));
            } catch (e) {
                console.error("Failed to save genres to cache", e);
            }
        }
    }, []);

    useEffect(() => {
        fetchGenres();
    }, [fetchGenres]);

    return (
        <div className="min-h-screen bg-background">
            <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-8">
                <header className="text-center space-y-4">
                    <div>
                        <h1 className="text-3xl font-bold font-headline text-primary">Explorar juegos</h1>
                        <p className="text-muted-foreground mt-1">Navega por géneros y descubre tu próxima aventura</p>
                    </div>
                </header>

                
                <main className="space-y-10">
                    {error && (
                        <div className="max-w-4xl mx-auto text-center py-16">
                            <p className="text-muted-foreground">{error}</p>
                        </div>
                    )}

                    {!error && (
                        <div className="max-w-5xl mx-auto space-y-12">
                            {genres.map(genre => <GenreRow key={genre.id} genre={genre} />)}
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}
