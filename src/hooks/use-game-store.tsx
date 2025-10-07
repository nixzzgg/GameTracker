"use client";

import React, { createContext, useContext, useEffect, useReducer, ReactNode } from 'react';
import { useAuth } from '@/hooks/use-auth';
import type { Game, GameStatus } from '@/lib/types';
import { loadUserData, saveUserData } from '@/lib/data-service';

export interface GameState {
  playing: Game[];
  completed: Game[];
  dropped: Game[];
  wishlist: Game[];
  recommendations: Game[];
}

export interface GameStore extends GameState {
  isLoaded: boolean;
}

type GameAction =
  | { type: 'ADD_GAME'; payload: { game: Game; status: GameStatus } }
  | { type: 'REMOVE_GAME'; payload: { id: number; status: GameStatus } }
  | { type: 'MOVE_GAME'; payload: { game: Game; from: GameStatus; to: GameStatus } }
  | { type: 'UPDATE_GAME'; payload: { game: Game; status: GameStatus } }
  | { type: 'SET_RECOMMENDATIONS'; payload: Game[] }
  | { type: 'SET_STATE'; payload: GameState };

const initialState: GameStore = {
  playing: [],
  completed: [],
  dropped: [],
  wishlist: [],
  recommendations: [],
  isLoaded: false,
};

const GameContext = createContext<{
  state: GameStore;
  addGame: (game: Game, status: GameStatus) => void;
  removeGame: (id: number, status: GameStatus) => void;
  moveGame: (game: Game, from: GameStatus, to: GameStatus) => void;
  updateGame: (game: Game, status: GameStatus) => void;
  setRecommendations: (recommendations: Game[]) => void;
} | undefined>(undefined);

function gameReducer(state: GameStore, action: GameAction): GameStore {
  switch (action.type) {
    case 'ADD_GAME': {
      const { game, status } = action.payload;
      const allGames = [
        ...(state.playing || []),
        ...(state.completed || []),
        ...(state.dropped || []),
        ...(state.wishlist || [])
      ];
      if (allGames.some(g => g.id === game.id)) {
        return state;
      }
      return {
        ...state,
        [status]: [...(state[status] || []), game]
      };
    }
    case 'REMOVE_GAME': {
      const { id, status } = action.payload;
      return {
        ...state,
        [status]: (state[status] || []).filter(game => game.id !== id),
      };
    }
    case 'MOVE_GAME': {
      const { game, from, to } = action.payload;
      const toList = state[to] || [];
      if (toList.some(g => g.id === game.id)) {
        return {
            ...state,
            [from]: (state[from] || []).filter(g => g.id !== game.id),
        };
      }
      return {
        ...state,
        [from]: (state[from] || []).filter(g => g.id !== game.id),
        [to]: [...toList, game],
      };
    }
    case 'UPDATE_GAME': {
      const { game: updatedGame, status } = action.payload;
      return {
        ...state,
        [status]: (state[status] || []).map(game =>
          game.id === updatedGame.id ? updatedGame : game
        ),
      };
    }
    case 'SET_RECOMMENDATIONS': {
      return {
        ...state,
        recommendations: action.payload,
      };
    }
    case 'SET_STATE': {
      const payload = action.payload || {};
      return {
        ...state,
        playing: payload.playing || [],
        completed: payload.completed || [],
        dropped: payload.dropped || [],
        wishlist: payload.wishlist || [],
        recommendations: payload.recommendations || [],
        isLoaded: true,
      };
    }
    default:
      return state;
  }
}

export function GameProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [state, dispatch] = useReducer(gameReducer, initialState);

  // Load data from JSON file when user logs in
  useEffect(() => {
    async function loadData() {
      if (user) {
        try {
          const userData = await loadUserData(user.id);
          dispatch({ type: 'SET_STATE', payload: userData });
        } catch (error) {
          console.error("Error loading user data from JSON file:", error);
          dispatch({ type: 'SET_STATE', payload: { playing: [], completed: [], dropped: [], wishlist: [], recommendations: [] } });
        }
      } else {
        // User logged out, reset state
        dispatch({ type: 'SET_STATE', payload: { playing: [], completed: [], dropped: [], wishlist: [], recommendations: [] } });
      }
    }
    loadData();
  }, [user]);

  // Save data to JSON file on state change
  useEffect(() => {
    if (user && state.isLoaded) {
      const { isLoaded, ...dataToSave } = state;
      saveUserData(user.id, dataToSave as GameState).catch(error => console.error("Error saving to JSON file:", error));
    }
  }, [state, user]);

  const addGame = (game: Game, status: GameStatus) => dispatch({ type: 'ADD_GAME', payload: { game, status } });
  const removeGame = (id: number, status: GameStatus) => dispatch({ type: 'REMOVE_GAME', payload: { id, status } });
  const moveGame = (game: Game, from: GameStatus, to: GameStatus) => dispatch({ type: 'MOVE_GAME', payload: { game, from, to } });
  const updateGame = (game: Game, status: GameStatus) => dispatch({ type: 'UPDATE_GAME', payload: { game, status } });
  const setRecommendations = (recommendations: Game[]) => dispatch({ type: 'SET_RECOMMENDATIONS', payload: recommendations });
  
  return (
    <GameContext.Provider value={{ state, addGame, removeGame, moveGame, updateGame, setRecommendations }}>
      {children}
    </GameContext.Provider>
  );
}

export function useGameStore() {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error('useGameStore must be used within a GameProvider');
  }
  return context;
}
