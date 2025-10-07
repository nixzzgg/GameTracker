import { z } from 'genkit';

export const DroppedGamesAnalysisInputSchema = z.object({
  droppedGames: z.array(z.string()).describe('List of games the user has dropped.'),
});
export type DroppedGamesAnalysisInput = z.infer<typeof DroppedGamesAnalysisInputSchema>;

export const DroppedGamesAnalysisOutputSchema = z.object({
  summary: z.string().describe("A 1-2 sentence summary in Spanish analyzing why the user might be dropping these games."),
  commonPatterns: z.array(z.string()).describe("A list of 2-3 common patterns or reasons identified from the dropped games list (e.g., 'Alta dificultad inicial', 'Mundo abierto abrumador', 'Requieren mucha dedicación'). The patterns should be in Spanish."),
});
export type DroppedGamesAnalysisOutput = z.infer<typeof DroppedGamesAnalysisOutputSchema>;
