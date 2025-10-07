
import { z } from 'genkit';

export const DynamicSuggestionInputSchema = z.object({
  completedGames: z.array(z.string()).describe("List of games the user has completed."),
  playingGames: z.array(z.string()).describe("The list of games the user is currently playing."),
  droppedGames: z.array(z.string()).describe("List of games the user has dropped."),
  wishlistGames: z.array(z.string()).describe("The list of games in the user's wishlist."),
  timeOfDay: z.string().describe("The current time of day for the user (e.g., 'madrugada', 'mañana', 'tarde', 'noche')."),
  userContext: z.string().optional().describe("El contexto o estado de ánimo actual del usuario para la sesión de juego (ej. 'busco algo corto', 'quiero una historia profunda', 'para relajarme')."),
  favoritePlatform: z.enum(['PC', 'PlayStation', 'Xbox', 'Nintendo', 'Mobile', 'Sin preferencias']).optional().describe("The user's favorite gaming platform."),
});
export type DynamicSuggestionInput = z.infer<typeof DynamicSuggestionInputSchema>;

export const DynamicSuggestionOutputSchema = z.object({
  gameName: z.string().describe("The name of the single game being suggested."),
  reasoning: z.string().describe("A brief, friendly, one-sentence explanation in Spanish for why this game is a good choice right now.")
});
export type DynamicSuggestionOutput = z.infer<typeof DynamicSuggestionOutputSchema>;