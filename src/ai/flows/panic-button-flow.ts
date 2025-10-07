'use server';
/**
 * @fileOverview An AI agent that gives a single, decisive game suggestion with a micro-task.
 *
 * - getPanicButtonSuggestion - A function that handles the suggestion process.
 * - PanicButtonInput - The input type for the function.
 * - PanicButtonOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { PanicButtonInputSchema, PanicButtonOutputSchema, type PanicButtonInput, type PanicButtonOutput } from '@/ai/schemas/panic-button';

export type { PanicButtonInput, PanicButtonOutput };

export async function getPanicButtonSuggestion(input: PanicButtonInput): Promise<PanicButtonOutput> {
  return panicButtonFlow(input);
}

const prompt = ai.definePrompt({
  name: 'panicButtonPrompt',
  input: {schema: PanicButtonInputSchema},
  output: {schema: PanicButtonOutputSchema},
  prompt: `Eres un "Entrenador de Juego" decidido y autoritario. Tu único objetivo es eliminar la fatiga de decisión del usuario. No das opciones, das una orden clara, directa y motivadora. La respuesta debe ser en español.

Analiza la lista de juegos "Jugando" del usuario:
- Jugando: {{#if playingGames}}{{#each playingGames}}{{this}}, {{/each}}{{else}}Ninguno{{/if}}

Tu tarea:
1.  Elige **UN SOLO** juego de la lista de "Jugando".
2.  Crea una **microtarea** para ese juego. Debe ser extremadamente específica, corta (realizable en 5-20 minutos) y accionable. No debe ser vaga. El objetivo es que el usuario empiece a jugar sin pensar.
3.  Combina el juego y la tarea en el campo "microTask".

Ejemplos de microtareas excelentes:
- "Abre 'Hades'. Intenta una sola huida. Nada más."
- "Inicia 'Stardew Valley'. Riega tus cultivos y revisa el correo. Misión cumplida."
- "Entra en 'Elden Ring'. Derrota a un solo grupo de enemigos cerca de una hoguera. Luego descansa."
- "Juega una partida de 'Rocket League'. Solo una."
- "En 'The Witcher 3', completa una misión secundaria. Ignora el resto."

Ejemplos de malas tareas (demasiado vagas):
- "Juega un poco a The Witcher 3"
- "Avanza en la historia"
- "Explora el mapa"

Genera la respuesta estrictamente en el formato JSON solicitado. El nombre del juego debe estar incluido en la microtarea.`,
});

const panicButtonFlow = ai.defineFlow(
  {
    name: 'panicButtonFlow',
    inputSchema: PanicButtonInputSchema,
    outputSchema: PanicButtonOutputSchema,
  },
  async (input) => {
    // A suggestion can only be made if the user is playing games.
    const hasGames = input.playingGames.length > 0;
    if (!hasGames) {
        return { gameName: "", microTask: "" };
    }
    const {output} = await prompt(input);
    return output!;
  }
);
