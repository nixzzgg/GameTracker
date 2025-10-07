'use server';
/**
 * @fileOverview An AI agent that analyzes a user's game lists to generate a "ADN Gamer" profile.
 *
 * - getAdnGamer - A function that handles the ADN Gamer generation process.
 * - AdnGamerInput - The input type for the getAdnGamer function.
 * - AdnGamerOutput - The return type for the getAdnGamer function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import {AdnGamerInputSchema, AdnGamerOutputSchema} from '@/ai/schemas/adn-gamer';

export type AdnGamerInput = z.infer<typeof AdnGamerInputSchema>;
export type AdnGamerOutput = z.infer<typeof AdnGamerOutputSchema>;

export async function getAdnGamer(input: AdnGamerInput): Promise<AdnGamerOutput> {
  return adnGamerFlow(input);
}

const prompt = ai.definePrompt({
  name: 'adnGamerPrompt',
  input: {schema: AdnGamerInputSchema},
  output: {schema: AdnGamerOutputSchema},
  prompt: `Eres un experto analista de videojuegos y psicólogo de jugadores. Tu tarea es analizar las listas de juegos de un usuario para crear su "ADN Gamer". El resultado debe estar en español.

Analiza las siguientes listas:
- Completados: {{#if completedGames}}{{#each completedGames}}{{this}}, {{/each}}{{else}}Ninguno{{/if}}
- Jugando: {{#if playingGames}}{{#each playingGames}}{{this}}, {{/each}}{{else}}Ninguno{{/if}}
- Deseados (Wishlist): {{#if wishlistGames}}{{#each wishlistGames}}{{this}}, {{/each}}{{else}}Ninguno{{/if}}
- Abandonados: {{#if droppedGames}}{{#each droppedGames}}{{this}}, {{/each}}{{else}}Ninguno{{/if}}

Considera los juegos completados y en curso como la evidencia más fuerte del gusto del usuario. La wishlist indica sus aspiraciones, y los juegos abandonados pueden revelar lo que no le gusta (quizás por dificultad, género o ritmo).

Basado en este análisis, genera un perfil "ADN Gamer" con la siguiente estructura:
1.  **summary**: Un resumen de 2-3 frases que describa el perfil del jugador. Por ejemplo: "Eres un aventurero de corazón con un amor por las narrativas profundas y los mundos inmersivos. No temes a los desafíos y disfrutas de la libertad que ofrecen los juegos de mundo abierto".
2.  **topGenres**: Los 3 géneros principales del usuario. Calcula un porcentaje para cada uno que refleje su peso en las listas. La suma de los porcentajes debe ser aproximadamente 100.
3.  **commonMechanics**: Una lista de hasta 5 mecánicas de juego recurrentes. Sé específico (ej. "Sistema de crafteo", "Combate por turnos", "Exploración de mundo abierto").
4.  **artisticStyles**: Una lista de hasta 3 estilos artísticos predominantes (ej. "Pixel Art", "Fotorrealismo", "Cel Shading").

Genera la respuesta estrictamente en el formato JSON solicitado.`,
});

const adnGamerFlow = ai.defineFlow(
  {
    name: 'adnGamerFlow',
    inputSchema: AdnGamerInputSchema,
    outputSchema: AdnGamerOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
