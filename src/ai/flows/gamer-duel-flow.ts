'use server';
/**
 * @fileOverview An AI agent that compares two Gamer DNA profiles.
 *
 * - getGamerDuel - A function that handles the comparison process.
 * - GamerDuelInput - The input type for the function.
 * - GamerDuelOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import {AdnGamerOutputSchema} from '@/ai/schemas/adn-gamer';

const GamerDuelInputSchema = z.object({
  user1Name: z.string().describe("The username for the first user."),
  user1Dna: AdnGamerOutputSchema.describe("The Gamer DNA profile for the first user."),
  user2Name: z.string().describe("The username for the second user."),
  user2Dna: AdnGamerOutputSchema.describe("The Gamer DNA profile for the second user."),
});
export type GamerDuelInput = z.infer<typeof GamerDuelInputSchema>;

const GamerDuelOutputSchema = z.object({
  title: z.string().describe("A catchy, fun title for the duel in Spanish, like 'El Duelo de los Titanes del Rol' or 'Estrategas en Conflicto'."),
  similarities: z.array(z.string()).describe("A list of 2-3 key similarities between the two players' tastes, written in Spanish."),
  differences: z.array(z.string()).describe("A list of 2-3 key differences between the two players' tastes, written in Spanish."),
  coopRecommendations: z.array(z.string()).describe("A list of 1-2 video game titles that would be great for them to play together in co-op, based on their combined tastes."),
});
export type GamerDuelOutput = z.infer<typeof GamerDuelOutputSchema>;

export async function getGamerDuel(input: GamerDuelInput): Promise<GamerDuelOutput> {
  return gamerDuelFlow(input);
}

const prompt = ai.definePrompt({
  name: 'gamerDuelPrompt',
  input: {schema: GamerDuelInputSchema},
  output: {schema: GamerDuelOutputSchema},
  prompt: `Eres un analista experto de perfiles de jugadores y un "matchmaker" de videojuegos. Tu tarea es comparar dos perfiles "ADN Gamer" y generar un análisis de duelo divertido y perspicaz, usando sus nombres de usuario en lugar de 'Jugador 1' y 'Jugador 2'. El resultado debe ser en español.

Aquí están los dos perfiles:

**{{user1Name}}:**
- Resumen: {{user1Dna.summary}}
- Géneros Top: {{#each user1Dna.topGenres}}{{this.genre}} ({{this.percentage}}%), {{/each}}
- Mecánicas: {{#each user1Dna.commonMechanics}}{{this}}, {{/each}}
- Estilos Artísticos: {{#each user1Dna.artisticStyles}}{{this}}, {{/each}}

**{{user2Name}}:**
- Resumen: {{user2Dna.summary}}
- Géneros Top: {{#each user2Dna.topGenres}}{{this.genre}} ({{this.percentage}}%), {{/each}}
- Mecánicas: {{#each user2Dna.commonMechanics}}{{this}}, {{/each}}
- Estilos Artísticos: {{#each user2Dna.artisticStyles}}{{this}}, {{/each}}

Basado en esta comparación, genera un análisis con la siguiente estructura:
1.  **title**: Un título creativo y llamativo para este duelo.
2.  **similarities**: Una lista de 2-3 puntos clave en los que ambos jugadores coinciden.
3.  **differences**: Una lista de 2-3 puntos clave en los que sus gustos difieren.
4.  **coopRecommendations**: Una lista de 1 o 2 juegos cooperativos que podrían disfrutar juntos. Busca un punto medio entre sus gustos o algo que complemente sus perfiles.

Genera la respuesta estrictamente en el formato JSON solicitado.`,
});

const gamerDuelFlow = ai.defineFlow(
  {
    name: 'gamerDuelFlow',
    inputSchema: GamerDuelInputSchema,
    outputSchema: GamerDuelOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
