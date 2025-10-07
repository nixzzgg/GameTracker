
export type GameStatus = 'playing' | 'completed' | 'dropped' | 'wishlist';

export interface Game {
  id: number;
  name: string;
  coverImage?: string;
  summary?: string;
  playtime?: number;
}

export interface ScheduleBlock {
  id: string;
  day: 'Lunes' | 'Martes' | 'Miércoles' | 'Jueves' | 'Viernes' | 'Sábado' | 'Domingo';
  start: string; // "HH:mm"
  end: string;   // "HH:mm"
}

export type Platform = 'PC' | 'PlayStation' | 'Xbox' | 'Nintendo' | 'Mobile' | 'Sin preferencias';

export interface User {
    id: string;
    username: string;
    profilePicture?: string;
    description?: string;
    isPublic?: boolean;
    schedule?: ScheduleBlock[];
    favoritePlatform?: Platform;
}

export interface Genre {
  id: number;
  name: string;
  slug: string;
  games_count: number;
  image_background: string;
}