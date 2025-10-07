"use client";

import { useEffect, useState } from 'react';
import type { Game, Genre } from '@/lib/types';
import { getGamesByGenre } from '@/app/(app)/search/actions';
import AddGameCard from '@/components/search/add-game-card';
import { Carousel, CarouselContent, CarouselItem } from '@/components/ui/carousel';
import Link from 'next/link';

const CACHE_DURATION = 60 * 60 * 1000; // 1 hour

interface GenreRowProps {
    genre: Genre;
}

export default function GenreRow({ genre }: GenreRowProps) {
    const [games, setGames] = useState<Game[]>([]);
    
    const cacheKey = `gametracker_genre_games_${genre.slug}`;

    useEffect(() => {
        const fetchGames = async () => {
            // Check cache first
            try {
                const cachedData = localStorage.getItem(cacheKey);
                if (cachedData) {
                    const { games: cachedGames, timestamp } = JSON.parse(cachedData);
                    if (Date.now() - timestamp < CACHE_DURATION) {
                        setGames(cachedGames);
                        return;
                    }
                }
            } catch (e) {
                console.error(`Failed to read games for ${genre.slug} from cache`, e);
            }
            
            // If no valid cache, fetch from API
            const result = await getGamesByGenre(genre.slug);
            if (result.games) {
                setGames(result.games);
                try {
                    const cachePayload = { games: result.games, timestamp: Date.now() };
                    localStorage.setItem(cacheKey, JSON.stringify(cachePayload));
                } catch (e) {
                    console.error(`Failed to save games for ${genre.slug} to cache`, e);
                }
            }
        };
        fetchGames();
    }, [genre.slug, cacheKey]);

    return (
        <div className="space-y-4">
            <Link href={`/explorar/${genre.slug}`}>
                <h2 className="text-2xl font-bold font-headline text-primary hover:underline">{genre.name}</h2>
            </Link>
            <Carousel data-horizontal-scroll="true" opts={{ align: "start", dragFree: true }} className="w-full">
                <CarouselContent className="-ml-4 scrollbar-hide">
                    {games.length > 0 && games.map(game => (
                        <CarouselItem key={game.id} className="basis-1/2 sm:basis-1/3 md:basis-1/4 lg:basis-1/5 xl:basis-1/6">
                            <div className="p-1 h-full">
                                <AddGameCard game={{...game, coverImage: game.coverImage || `https://placehold.co/600x800.png`}} />
                            </div>
                        </CarouselItem>
                    ))}
                </CarouselContent>
            </Carousel>
        </div>
    );
}
