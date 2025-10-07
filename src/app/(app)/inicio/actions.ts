
'use server';

import { findUserById, loadUserData } from '@/lib/data-service';
import { getDynamicSuggestion } from '@/ai/flows/dynamic-suggestion-flow';
import { searchGames } from '@/app/(app)/search/actions';
import { getPlaytimePrediction } from '@/ai/flows/playtime-prediction-flow';
import { getDifficultyAnalysis } from '@/ai/flows/difficulty-analysis-flow';
import { getPanicButtonSuggestion } from '@/ai/flows/panic-button-flow';


// Action for Dynamic Suggestion
export async function fetchDynamicSuggestion(userId: string, timeOfDay: string, userContext?: string) {
    try {
        const [user, lists] = await Promise.all([
            findUserById(userId),
            loadUserData(userId)
        ]);

        if (!user) {
            return { suggestion: null, error: "Usuario no encontrado." };
        }
        
        const hasGames = lists.playing.length > 0 || lists.wishlist.length > 0 || lists.completed.length > 0 || lists.dropped.length > 0;
        if (!hasGames) {
            return { suggestion: null, error: "Añade juegos a tus listas para recibir sugerencias." };
        }

        const suggestionResult = await getDynamicSuggestion({
            completedGames: lists.completed.map(g => g.name),
            playingGames: lists.playing.map(g => g.name),
            droppedGames: lists.dropped.map(g => g.name),
            wishlistGames: lists.wishlist.map(g => g.name),
            timeOfDay,
            userContext,
        });

        if (!suggestionResult.gameName) {
            return { suggestion: null, error: "La IA no pudo generar una sugerencia en este momento. ¡Inténtalo de nuevo!" };
        }

        const searchResult = await searchGames(suggestionResult.gameName);
        const gameDetails = searchResult.games?.[0];

        if (!gameDetails) {
            return { suggestion: null, error: `No se pudo encontrar el juego "${suggestionResult.gameName}".` };
        }

        return {
            suggestion: {
                game: gameDetails,
                reasoning: suggestionResult.reasoning,
            },
            error: null,
        };

    } catch (e: any) {
        console.error("Error fetching dynamic suggestion:", e);
        return { suggestion: null, error: "No se pudo obtener la sugerencia dinámica." };
    }
}

export async function fetchPlaytimePrediction(userId: string, gameName: string) {
    try {
        const [user, lists, searchResult] = await Promise.all([
            findUserById(userId),
            loadUserData(userId),
            searchGames(gameName, 1)
        ]);
        
        if (!user) {
             return { prediction: null, error: `Usuario no encontrado.` };
        }

        const gameDetails = searchResult.games?.[0];

        if (!gameDetails || !gameDetails.playtime || gameDetails.playtime <= 0) {
            return { prediction: null, error: `No se encontraron datos de duración para "${gameName}".` };
        }

        const predictionResult = await getPlaytimePrediction({
            gameName: gameDetails.name,
            averagePlaytime: gameDetails.playtime,
            userCompletedGames: lists.completed.map(g => g.name),
            userSchedule: user.schedule || [],
        });
        
        return { prediction: predictionResult.prediction, error: null };

    } catch (e: any) {
        console.error("Error fetching playtime prediction:", e);
        return { prediction: null, error: "No se pudo obtener la predicción." };
    }
}


export async function fetchDifficultyAnalysis(userId: string, gameName: string) {
    try {
        const lists = await loadUserData(userId);

        const analysisResult = await getDifficultyAnalysis({
            gameName: gameName,
            completedGames: lists.completed.map(g => g.name),
            droppedGames: lists.dropped.map(g => g.name),
        });

        return { analysis: analysisResult.analysis, error: null };

    } catch (e: any) {
        console.error("Error fetching difficulty analysis:", e);
        return { analysis: null, error: "No se pudo obtener el análisis." };
    }
}


export async function fetchPanicButtonSuggestion(userId: string) {
    try {
        const lists = await loadUserData(userId);

        const hasGames = lists.playing.length > 0;
        if (!hasGames) {
            return { suggestion: null, error: "Añade juegos a tu lista de 'Jugando' para usar esta función." };
        }

        const suggestionResult = await getPanicButtonSuggestion({
            playingGames: lists.playing.map(g => g.name),
            wishlistGames: [], // Solo juegos que está jugando
        });

        if (!suggestionResult.gameName || !suggestionResult.microTask) {
             return { suggestion: null, error: "La IA no pudo decidir por ti. ¡Elige tú, soldado!" };
        }
        
        const searchResult = await searchGames(suggestionResult.gameName);
        const gameDetails = searchResult.games?.[0];

        if (!gameDetails) {
            return { suggestion: null, error: `No se pudo encontrar el juego "${suggestionResult.gameName}".` };
        }

        return {
            suggestion: {
                game: gameDetails,
                microTask: suggestionResult.microTask,
            },
            error: null,
        };

    } catch(e: any) {
        console.error("Error fetching panic button suggestion:", e);
        return { suggestion: null, error: "No se pudo contactar al entrenador. Inténtalo de nuevo." };
    }
}
