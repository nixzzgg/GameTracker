import { z } from 'genkit';

export const DifficultyAnalysisInputSchema = z.object({
  gameName: z.string().describe("The name of the game to analyze."),
  completedGames: z.array(z.string()).describe("A list of games the user has completed."),
  droppedGames: z.array(z.string()).describe("A list of games the user has dropped."),
});
export type DifficultyAnalysisInput = z.infer<typeof DifficultyAnalysisInputSchema>;

export const DifficultyAnalysisOutputSchema = z.object({
  analysis: z.string().describe("A personalized analysis (2-3 sentences, in Spanish) of the game's difficulty relative to the user's profile. It should explain the *type* of difficulty (e.g., strategic, execution-based, puzzle-solving) and predict if the user will enjoy it or find it frustrating based on their history."),
});
export type DifficultyAnalysisOutput = z.infer<typeof DifficultyAnalysisOutputSchema>;
