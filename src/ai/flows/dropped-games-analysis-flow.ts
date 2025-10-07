'use server';
/**
 * @fileOverview An AI agent that analyzes a user's dropped games to find patterns.
 *
 * - getDroppedGamesAnalysis - A function that handles the analysis process.
 * - DroppedGamesAnalysisInput - The input type for the function.
 * - DroppedGamesAnalysisOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { DroppedGamesAnalysisInputSchema, DroppedGamesAnalysisOutputSchema, type DroppedGamesAnalysisInput, type DroppedGamesAnalysisOutput } from '@/ai/schemas/dropped-games-analysis';

export type { DroppedGamesAnalysisInput, DroppedGamesAnalysisOutput };

export async function getDroppedGamesAnalysis(input: DroppedGamesAnalysisInput): Promise<DroppedGamesAnalysisOutput> {
  return droppedGamesAnalysisFlow(input);
}

const prompt = ai.definePrompt({
  name: 'droppedGamesAnalysisPrompt',
  input: {schema: DroppedGamesAnalysisInputSchema},
  output: {schema: DroppedGamesAnalysisOutputSchema},
  prompt: `Eres un psicólogo de jugadores experto en analizar comportamientos. Tu tarea es analizar la lista de juegos "Abandonados" de un usuario para identificar patrones y darle un feedback constructivo. La respuesta debe ser en español.

Juegos Abandonados:
{{#if droppedGames}}{{#each droppedGames}}- {{this}}
{{/each}}{{else}}Ninguno{{/if}}

Analiza esta lista y genera una respuesta con la siguiente estructura:
1.  **summary**: Un resumen breve (1-2 frases) que ofrezca una posible interpretación del porqué abandona estos juegos. Ejemplo: "Parece que valoras tu tiempo y prefieres experiencias que te enganchen rápidamente, dejando de lado juegos que se sienten demasiado lentos o repetitivos al principio."
2.  **commonPatterns**: Una lista de 2 a 3 patrones comunes que identifiques. Sé específico. Ejemplos: "Juegos con una curva de dificultad muy alta", "Mundos abiertos que pueden resultar abrumadores", "Requieren una gran inversión de tiempo inicial".

No seas negativo. Enfócate en ayudar al usuario a entender sus propios gustos para que pueda elegir mejor en el futuro. Genera la respuesta estrictamente en el formato JSON solicitado.`,
});

const droppedGamesAnalysisFlow = ai.defineFlow(
  {
    name: 'droppedGamesAnalysisFlow',
    inputSchema: DroppedGamesAnalysisInputSchema,
    outputSchema: DroppedGamesAnalysisOutputSchema,
  },
  async input => {
    if (input.droppedGames.length === 0) {
      return { summary: '', commonPatterns: [] };
    }
    const {output} = await prompt(input);
    return output!;
  }
);
