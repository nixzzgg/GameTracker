"use client";

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useGameStore } from '@/hooks/use-game-store';
import { getPersonalizedGameRecommendations } from '@/ai/flows/personalized-game-recommendations';
import { searchGames } from '@/app/(app)/search/actions';
import type { Game } from '@/lib/types';
import AddGameCard from '@/components/search/add-game-card';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';

const RECS_COUNT_CACHE_KEY = 'gametracker_recs_game_count';
const REFRESH_THRESHOLD = 3;

export default function Recommendations() {
  const { user } = useAuth();
  const { state, setRecommendations } = useGameStore();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cacheKey = useMemo(() => user ? `${RECS_COUNT_CACHE_KEY}_${user.id}` : null, [user]);

  const hasGames = useMemo(() => {
    return state.completed.length > 0 || state.playing.length > 0 || state.dropped.length > 0 || state.wishlist.length > 0;
  }, [state.completed, state.playing, state.dropped, state.wishlist]);

  const fetchRecommendations = useCallback(async (currentTotalGames: number) => {
    if (!state.isLoaded || !hasGames || !cacheKey || !user) return;

    setIsLoading(true);
    setError(null);
    try {
      const input = {
        completedGames: state.completed.map(g => g.name),
        playingGames: state.playing.map(g => g.name),
        droppedGames: state.dropped.map(g => g.name),
        wishlistGames: state.wishlist.map(g => g.name),
        favoritePlatform: user.favoritePlatform,
      };

      const result = await getPersonalizedGameRecommendations(input);
      const gameNames = result.recommendations;

      const gamePromises = gameNames.map(async (name, index) => {
          const searchResult = await searchGames(name);
          if (searchResult.games && searchResult.games.length > 0) {
              return {
                  ...searchResult.games[0],
                  coverImage: searchResult.games[0].coverImage || `https://placehold.co/600x800.png`
              };
          }
          return { id: -1 - index, name, coverImage: `https://placehold.co/600x800.png`, summary: '' };
      });

      const gamesWithDetails = await Promise.all(gamePromises);
      setRecommendations(gamesWithDetails);
      
      // Update cache with the new game count
      localStorage.setItem(cacheKey, currentTotalGames.toString());

    } catch (e) {
      console.error(e);
      setError('No se pudieron obtener las recomendaciones, por favor, inténtalo de nuevo más tarde');
    } finally {
      setIsLoading(false);
    }
  }, [state.isLoaded, hasGames, cacheKey, setRecommendations, state.completed, state.playing, state.dropped, state.wishlist, user]);
  
  const totalGamesCount = useMemo(() => {
    return state.completed.length + state.playing.length + state.dropped.length + state.wishlist.length;
  }, [state.completed, state.playing, state.dropped, state.wishlist]);

  useEffect(() => {
    if (!state.isLoaded) {
      setIsLoading(true);
      return;
    }
    
    if (!hasGames) {
      setIsLoading(false);
      if (state.recommendations.length > 0) {
        setRecommendations([]);
      }
      return;
    }
    
    if (!cacheKey) {
        setIsLoading(false);
        return;
    }

    const lastRecsGameCount = parseInt(localStorage.getItem(cacheKey) || '0', 10);
    const hasCachedRecommendations = state.recommendations && state.recommendations.length > 0;
    
    const shouldRefresh = !hasCachedRecommendations || (totalGamesCount >= lastRecsGameCount + REFRESH_THRESHOLD);

    if (shouldRefresh) {
      fetchRecommendations(totalGamesCount);
    } else {
      setIsLoading(false);
    }

  }, [state.isLoaded, totalGamesCount, hasGames, cacheKey, state.recommendations, fetchRecommendations, setRecommendations]);
  
  const recommendations = state.recommendations || [];

  return (
    <div>
      {isLoading ? (
        <div className="flex justify-center items-center py-24">
          <div className="flex flex-col items-center gap-4 text-muted-foreground">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="font-semibold font-headline">Buscando recomendaciones...</p>
          </div>
        </div>
      ) : error ? (
        <div className="text-muted-foreground text-center p-8">{error}</div>
      ) : recommendations.length === 0 ? (
        <div className="text-center text-muted-foreground p-8">
          <h3 className="text-xl font-semibold font-headline">Aún no hay recomendaciones</h3>
          <p className="mt-2">Añade algunos juegos a tus listas para obtener recomendaciones personalizadas</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {recommendations.map((game) => (
              <AddGameCard key={game.id} game={{...game, coverImage: game.coverImage || `https://placehold.co/600x800.png`}} />
          ))}
        </div>
      )}
    </div>
  );
}
