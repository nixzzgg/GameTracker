
'use server';

/**
 * @fileOverview A personalized game recommendation AI agent.
 *
 * - getPersonalizedGameRecommendations - A function that retrieves personalized game recommendations.
 * - PersonalizedGameRecommendationsInput - The input type for the getPersonalizedGameRecommendations function.
 * - PersonalizedGameRecommendationsOutput - The return type for the getPersonalizedGameRecommendations function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const PersonalizedGameRecommendationsInputSchema = z.object({
  completedGames: z.array(z.string()).describe('List of games the user has completed.'),
  playingGames: z.array(z.string()).describe('List of games the user is currently playing.'),
  droppedGames: z.array(z.string()).describe('List of games the user has dropped.'),
  wishlistGames: z.array(z.string()).describe('List of games the user has in their wishlist.'),
  favoritePlatform: z.enum(['PC', 'PlayStation', 'Xbox', 'Nintendo', 'Mobile', 'Sin preferencias']).optional().describe("The user's favorite gaming platform."),
});
export type PersonalizedGameRecommendationsInput = z.infer<typeof PersonalizedGameRecommendationsInputSchema>;

const PersonalizedGameRecommendationsOutputSchema = z.object({
  recommendations: z.array(z.string()).describe('A list of 12 personalized game recommendations.'),
});
export type PersonalizedGameRecommendationsOutput = z.infer<typeof PersonalizedGameRecommendationsOutputSchema>;

export async function getPersonalizedGameRecommendations(input: PersonalizedGameRecommendationsInput): Promise<PersonalizedGameRecommendationsOutput> {
  return personalizedGameRecommendationsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'personalizedGameRecommendationsPrompt',
  input: {schema: PersonalizedGameRecommendationsInputSchema},
  output: {schema: PersonalizedGameRecommendationsOutputSchema},
  prompt: `You are an expert game recommender. Based on the user's game history, provide a list of personalized game recommendations.

Here is the user's game history:
Completed Games: {{#if completedGames}}{{#each completedGames}}- {{this}}
{{/each}}{{else}}None{{/if}}
Playing Games: {{#if playingGames}}{{#each playingGames}}- {{this}}
{{/each}}{{else}}None{{/if}}
Dropped Games: {{#if droppedGames}}{{#each droppedGames}}- {{this}}
{{/each}}{{else}}None{{/if}}
Wishlist Games: {{#if wishlistGames}}{{#each wishlistGames}}- {{this}}
{{/each}}{{else}}None{{/if}}

{{#if favoritePlatform}}The user's favorite platform is {{favoritePlatform}}. Prioritize games available on this platform. If you recommend a multi-platform game, that's great. If you recommend an exclusive, it should be for this platform. If the platform is "Sin preferencias", do not prioritize any platform.{{/if}}

Based on this information, what games do you think the user would enjoy? Provide a list of exactly 12 game titles.
`,
});

const personalizedGameRecommendationsFlow = ai.defineFlow(
  {
    name: 'personalizedGameRecommendationsFlow',
    inputSchema: PersonalizedGameRecommendationsInputSchema,
    outputSchema: PersonalizedGameRecommendationsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);

    