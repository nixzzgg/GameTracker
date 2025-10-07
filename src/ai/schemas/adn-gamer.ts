import {z} from 'genkit';

export const AdnGamerInputSchema = z.object({
  completedGames: z.array(z.string()).describe('List of games the user has completed.'),
  playingGames: z.array(z.string()).describe('List of games the user is currently playing.'),
  droppedGames: z.array(z.string()).describe('List of games the user has dropped.'),
  wishlistGames: z.array(z.string()).describe('List of games the user has in their wishlist.'),
});

export const AdnGamerOutputSchema = z.object({
  summary: z.string().describe("A 2-3 sentence summary of the user's gaming profile and taste, written in Spanish."),
  topGenres: z.array(z.object({
    genre: z.string().describe("The name of the genre in Spanish (e.g., 'Rol', 'Aventura')."),
    percentage: z.number().min(0).max(100).describe("The percentage of this genre in the user's lists, from 0 to 100.")
  })).describe("A list of the user's top 3 most played genres with their percentage. The percentages should add up to roughly 100%. The genres should be in Spanish."),
  commonMechanics: z.array(z.string()).describe("A list of up to 5 common gameplay mechanics found in the user's games (e.g., 'Mundo abierto', 'Crafteo'). The mechanics should be in Spanish."),
  artisticStyles: z.array(z.string()).describe("A list of up to 3 common artistic styles found in the user's games (e.g., 'Pixel Art', 'Cel Shading'). The styles should be in Spanish.")
});
