
'use server';
/**
 * @fileOverview An AI agent that provides a dynamic game suggestion based on context.
 *
 * - getDynamicSuggestion - A function that handles the suggestion process.
 * - DynamicSuggestionInput - The input type for the function.
 * - DynamicSuggestionOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { DynamicSuggestionInputSchema, DynamicSuggestionOutputSchema, type DynamicSuggestionInput, type DynamicSuggestionOutput } from '@/ai/schemas/dynamic-suggestion';

export type { DynamicSuggestionInput, DynamicSuggestionOutput };

export async function getDynamicSuggestion(input: DynamicSuggestionInput): Promise<DynamicSuggestionOutput> {
  return dynamicSuggestionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'dynamicSuggestionPrompt',
  input: {schema: DynamicSuggestionInputSchema},
  output: {schema: DynamicSuggestionOutputSchema},
  prompt: `Eres un experto recomendador de videojuegos y un compañero de juegos perspicaz. Tu tarea es sugerir un solo juego para jugar ahora mismo, basándote en el perfil completo del usuario, la hora del día y su contexto actual. El resultado debe ser en español.

**Tu objetivo principal es ayudar al usuario a descubrir nuevos juegos que le encantarán.**

Analiza el perfil completo del usuario:
- Completados: {{#if completedGames}}{{#each completedGames}}{{this}}, {{/each}}{{else}}Ninguno{{/if}}
- Jugando ahora: {{#if playingGames}}{{#each playingGames}}{{this}}, {{/each}}{{else}}Ninguno{{/if}}
- Abandonados: {{#if droppedGames}}{{#each droppedGames}}{{this}}, {{/each}}{{else}}Ninguno{{/if}}
- Lista de Deseos: {{#if wishlistGames}}{{#each wishlistGames}}{{this}}, {{/each}}{{else}}Ninguna{{/if}}

Contexto actual:
- Momento del día: {{timeOfDay}}
{{#if userContext}}- Petición del usuario: "{{userContext}}"{{/if}}
{{#if favoritePlatform}}- Plataforma preferida: {{favoritePlatform}}. Dale prioridad a juegos de esta plataforma, a menos que sea "Sin preferencias".{{/if}}

Lógica de sugerencia:
1.  **Prioriza la petición del usuario.** Si el usuario pide "algo corto y relajante", busca un juego que encaje con eso, analizando su perfil para ver qué tipo de juegos cortos y relajantes le gustan.
2.  **Sugiere juegos nuevos.** Basándote en todo su historial, infiere sus gustos (géneros, mecánicas, estilos) y sugiere un juego NUEVO que no esté en ninguna de sus listas. Esta es la opción preferida.
3.  **Considera la plataforma.** Si el usuario especificó una plataforma favorita (y no es "Sin preferencias"), asegúrate de que tu sugerencia esté disponible en ella.
4.  **Como alternativa, sugiere un juego de sus listas.** Si un juego de su lista "Jugando ahora" o "Wishlist" encaja PERFECTAMENTE con su petición, puedes sugerirlo. Por ejemplo, si está jugando un RPG masivo y pide "una aventura larga", es una buena opción sugerir que continúe.
5.  La razón debe ser personal y explicar por qué le gustaría ESE juego AHORA. Ejemplo: "Dado que te encantó 'Stardew Valley', y buscas algo para relajarte, 'Animal Crossing: New Horizons' podría ser tu próximo gran vicio."

Genera la respuesta estrictamente en el formato JSON solicitado.`,
});

const dynamicSuggestionFlow = ai.defineFlow(
  {
    name: 'dynamicSuggestionFlow',
    inputSchema: DynamicSuggestionInputSchema,
    outputSchema: DynamicSuggestionOutputSchema,
  },
  async (input) => {
    // A suggestion can only be made if the user has played, completed, dropped, or wishlisted at least one game.
    const hasGames = input.playingGames.length > 0 || input.wishlistGames.length > 0 || input.completedGames.length > 0 || input.droppedGames.length > 0;
    if (!hasGames) {
        return { gameName: "", reasoning: "" };
    }
    const {output} = await prompt(input);
    return output!;
  }
);