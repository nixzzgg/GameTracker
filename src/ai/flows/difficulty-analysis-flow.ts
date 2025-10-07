'use server';
/**
 * @fileOverview An AI agent that provides a personalized difficulty analysis for a game.
 *
 * - getDifficultyAnalysis - A function that handles the analysis process.
 * - DifficultyAnalysisInput - The input type for the function.
 * - DifficultyAnalysisOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { DifficultyAnalysisInputSchema, DifficultyAnalysisOutputSchema, type DifficultyAnalysisInput, type DifficultyAnalysisOutput } from '@/ai/schemas/difficulty-analysis';

export type { DifficultyAnalysisInput, DifficultyAnalysisOutput };

export async function getDifficultyAnalysis(input: DifficultyAnalysisInput): Promise<DifficultyAnalysisOutput> {
  return difficultyAnalysisFlow(input);
}

const prompt = ai.definePrompt({
  name: 'difficultyAnalysisPrompt',
  input: {schema: DifficultyAnalysisInputSchema},
  output: {schema: DifficultyAnalysisOutputSchema},
  prompt: `Eres un analista de videojuegos experto. Tu tarea es analizar la dificultad de un juego específico. La respuesta debe estar en español.

Juego a analizar: {{gameName}}
Historial del jugador (Juegos completados): {{#if completedGames}}{{#each completedGames}}{{this}}, {{/each}}{{else}}Ninguno{{/if}}
Historial del jugador (Juegos abandonados): {{#if droppedGames}}{{#each droppedGames}}{{this}}, {{/each}}{{else}}Ninguno{{/if}}

Tu análisis debe:
1.  Identificar el **tipo** de dificultad principal de {{gameName}} (p. ej., estratégica, de reflejos, de puzles, etc.).
2.  **Si el historial del jugador contiene juegos**: Ofrece un análisis **personalizado**. Compara la dificultad de {{gameName}} con los juegos que ha completado o abandonado. Advierte si es similar a juegos que abandonó, o anima si es parecido a los que completó.
3.  **Si el historial del jugador está vacío (es "Ninguno")**: Ofrece un análisis **general**. Describe la curva de dificultad del juego y para qué tipo de jugador es más adecuado.
4.  Resume tu conclusión en el campo "analysis" (2-3 frases).

Ejemplo (Análisis personalizado): "La dificultad de Sekiro se basa en reflejos puros. Dado que abandonaste 'Cuphead', que requiere una destreza similar, es posible que este reto te resulte frustrante."
Ejemplo (Análisis general): "La dificultad de 'Hollow Knight' se centra en la exploración y combates de alta precisión. Es ideal para jugadores pacientes que disfrutan descubriendo secretos y no temen a los jefes desafiantes."

Genera la respuesta estrictamente en el formato JSON solicitado.`,
});

const difficultyAnalysisFlow = ai.defineFlow(
  {
    name: 'difficultyAnalysisFlow',
    inputSchema: DifficultyAnalysisInputSchema,
    outputSchema: DifficultyAnalysisOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
