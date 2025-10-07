import { z } from 'genkit';

export const PanicButtonInputSchema = z.object({
  playingGames: z.array(z.string()).describe("The list of games the user is currently playing."),
  wishlistGames: z.array(z.string()).describe("The list of games in the user's wishlist."),
});
export type PanicButtonInput = z.infer<typeof PanicButtonInputSchema>;

export const PanicButtonOutputSchema = z.object({
  gameName: z.string().describe("The name of the single game being suggested."),
  microTask: z.string().describe("A brief, direct, and actionable micro-task in Spanish for the suggested game. It should be a clear command.")
});
export type PanicButtonOutput = z.infer<typeof PanicButtonOutputSchema>;
