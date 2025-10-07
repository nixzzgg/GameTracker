
'use server';

import type { Game, Genre } from '@/lib/types';

interface RawgGame {
  id: number;
  name: string;
  background_image: string | null;
  description_raw?: string;
  playtime?: number;
}

interface SearchResult {
    games?: Game[];
    error?: string;
    nextPage?: number | null;
}

function mapRawgGameToGame(rawgGame: RawgGame): Game {
    return {
        id: rawgGame.id,
        name: rawgGame.name,
        coverImage: rawgGame.background_image || `https://placehold.co/600x800.png`,
        summary: rawgGame.description_raw || 'No hay descripción disponible',
        playtime: rawgGame.playtime || 0,
    };
}


export async function searchGames(query: string, page: number = 1): Promise<SearchResult> {
  const apiKey = process.env.RAWG_API_KEY;

  if (!apiKey) {
    console.error('RAWG_API_KEY is not set in .env file');
    return { error: 'El servicio de búsqueda de juegos no está configurado!' };
  }

  if (!query) {
    return { games: [], nextPage: null };
  }

  try {
    const pageSize = 12; 
    const url = `https://api.rawg.io/api/games?key=${apiKey}&search=${encodeURIComponent(query)}&page_size=${pageSize}&page=${page}`;
    const response = await fetch(url, { headers: { 'User-Agent': 'GameTrackerApp/1.0' } });

    if (!response.ok) {
      console.error(`RAWG API error: ${response.status} ${response.statusText}`);
      const errorBody = await response.text();
      console.error('Error body:', errorBody);
      return { error: 'No se pudieron obtener los juegos de la base de datos' };
    }

    const data = await response.json();
    
    const games: Game[] = data.results.map((rawgGame: RawgGame) => ({
      id: rawgGame.id,
      name: rawgGame.name,
      coverImage: rawgGame.background_image || `https://placehold.co/600x800.png`,
      summary: '', 
      playtime: rawgGame.playtime || 0,
    }));

    const nextPage = data.next ? page + 1 : null;

    return { games, nextPage };
  } catch (error) {
    console.error('Error searching games:', error);
    return { error: 'Ocurrió un error inesperado al buscar juegos' };
  }
}

export async function getPopularGames(page: number = 1): Promise<SearchResult> {
    const apiKey = process.env.RAWG_API_KEY;
  
    if (!apiKey) {
      console.error('RAWG_API_KEY is not set in .env file');
      return { error: 'El servicio de búsqueda de juegos no está configurado!' };
    }
  
    try {
      const url = `https://api.rawg.io/api/games?key=${apiKey}&page=${page}&page_size=20&ordering=-added`;
      const response = await fetch(url, { headers: { 'User-Agent': 'GameTrackerApp/1.0' } });
  
      if (!response.ok) {
        console.error(`RAWG API error: ${response.status} ${response.statusText}`);
        const errorBody = await response.text();
        console.error('Error body:', errorBody);
        return { error: 'No se pudieron obtener los juegos' };
      }
  
      const data = await response.json();
      
      const games: Game[] = data.results.map(mapRawgGameToGame);
  
      const nextPage = data.next ? page + 1 : null;

      return { games, nextPage };
    } catch (error) {
      console.error('Error fetching popular games:', error);
      return { error: 'Ocurrió un error inesperado al buscar juegos' };
    }
}


export async function getGameDetails(id: number): Promise<Game | null> {
    const apiKey = process.env.RAWG_API_KEY;
  
    if (!apiKey) {
      console.error('RAWG_API_KEY is not set in .env file');
      return null;
    }
  
    try {
      const url = `https://api.rawg.io/api/games/${id}?key=${apiKey}`;
      const response = await fetch(url, { headers: { 'User-Agent': 'GameTrackerApp/1.0' } });
  
      if (!response.ok) {
        console.error(`RAWG API error fetching details: ${response.status} ${response.statusText}`);
        return null;
      }
  
      const rawgGame: RawgGame = await response.json();
      
      return mapRawgGameToGame(rawgGame);
    } catch (error) {
      console.error('Error fetching game details:', error);
      return null;
    }
}

export async function getGenres(): Promise<{ genres?: Genre[], error?: string }> {
    const apiKey = process.env.RAWG_API_KEY;
    if (!apiKey) {
        console.error('RAWG_API_KEY is not set in .env file');
        return { error: 'El servicio de búsqueda de juegos no está configurado!' };
    }
    
    try {
        const url = `https://api.rawg.io/api/genres?key=${apiKey}`;
        const response = await fetch(url, { headers: { 'User-Agent': 'GameTrackerApp/1.0' } });
        if (!response.ok) return { error: 'No se pudieron obtener los géneros' };

        const data = await response.json();
        const genres: Genre[] = data.results.map((g: any) => ({
            id: g.id,
            name: g.name,
            slug: g.slug,
            games_count: g.games_count,
            image_background: g.image_background,
        }));
        
        const filteredGenres = genres.filter(g => ['action', 'indie', 'adventure', 'role-playing-games-rpg', 'shooter', 'strategy', 'puzzle', 'racing', 'sports', 'simulation', 'platformer', 'fighting'].includes(g.slug));
        
        return { genres: filteredGenres };
    } catch (error) {
        console.error('Error fetching genres:', error);
        return { error: 'Ocurrió un error inesperado al buscar géneros' };
    }
}

export async function getGamesByGenre(slug: string, page: number = 1): Promise<SearchResult> {
    const apiKey = process.env.RAWG_API_KEY;
    if (!apiKey) {
        console.error('RAWG_API_KEY is not set in .env file');
        return { error: 'El servicio de búsqueda de juegos no está configurado!' };
    }

    try {
        const url = `https://api.rawg.io/api/games?key=${apiKey}&genres=${slug}&page_size=24&page=${page}`;
        const response = await fetch(url, { headers: { 'User-Agent': 'GameTrackerApp/1.0' } });
        if (!response.ok) return { error: `No se pudieron obtener los juegos para el género ${slug}` };
        
        const data = await response.json();
        const games: Game[] = data.results.map(mapRawgGameToGame);

        const nextPage = data.next ? page + 1 : null;

        return { games, nextPage };
    } catch (error) {
        console.error(`Error fetching games for genre ${slug}:`, error);
        return { error: 'Ocurrió un error inesperado al buscar juegos' };
    }
}
