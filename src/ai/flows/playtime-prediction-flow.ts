'use server';
/**
 * @fileOverview An AI agent that predicts game playtime for a user.
 *
 * - getPlaytimePrediction - A function that handles the prediction process.
 * - PlaytimePredictionInput - The input type for the function.
 * - PlaytimePredictionOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const PlaytimePredictionInputSchema = z.object({
  gameName: z.string().describe("The name of the game for which to predict the playtime."),
  averagePlaytime: z.number().describe("The average playtime for the game in hours, according to public data."),
  userCompletedGames: z.array(z.string()).describe("A list of games the user has already completed."),
  userSchedule: z.array(z.object({
      id: z.string(),
      day: z.string(),
      start: z.string(),
      end: z.string(),
  })).optional().describe("The user's weekly gaming schedule. Can be used to make the prediction more practical."),
});
export type PlaytimePredictionInput = z.infer<typeof PlaytimePredictionInputSchema>;

const PlaytimePredictionOutputSchema = z.object({
  prediction: z.string().describe("A personalized playtime prediction in Spanish, presented as a single sentence. Example: 'Dado que te gustan los RPG de mundo abierto, estimamos que te llevará unas 85 horas completarlo.'"),
});
export type PlaytimePredictionOutput = z.infer<typeof PlaytimePredictionOutputSchema>;

export async function getPlaytimePrediction(input: PlaytimePredictionInput): Promise<PlaytimePredictionOutput> {
  return playtimePredictionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'playtimePredictionPrompt',
  input: {schema: PlaytimePredictionInputSchema},
  output: {schema: PlaytimePredictionOutputSchema},
  prompt: `Eres el "Oráculo del Tiempo", un experto en predecir cuánto tardará un jugador en completar un videojuego.

Datos del juego a predecir:
- Nombre: {{gameName}}
- Duración media (pública): {{averagePlaytime}} horas

Historial del jugador (juegos completados):
{{#if userCompletedGames}}{{#each userCompletedGames}}- {{this}}
{{/each}}{{else}}Ninguno{{/if}}

Horario de juego semanal del usuario:
{{#if userSchedule}}{{#each userSchedule}}- {{this.day}}: de {{this.start}} a {{this.end}}
{{/each}}{{else}}No especificado.{{/if}}

Tu tarea es dar una predicción de tiempo personalizada para {{gameName}}.
1.  Usa el historial del jugador para ajustar la predicción. Si ha completado juegos largos y similares, su tiempo podría ser cercano o inferior a la media. Si suele jugar títulos más cortos, podría tardar más.
2.  Si el usuario ha proporcionado un horario, úsalo para dar un toque más práctico a la predicción. Por ejemplo, si un juego dura 40 horas y el usuario juega 10 horas a la semana, puedes mencionar que le llevaría aproximadamente un mes.
3.  Si no hay un patrón claro o no hay horario, basa tu estimación en la media pero dale un toque personal.

Genera una única frase como predicción en español. Sé directo y conciso.
Ejemplo con horario: "Con tu ritmo y tu horario actual, podrías completar este juego en aproximadamente 3 semanas."
Ejemplo sin horario: "Basándonos en tu experiencia con juegos de rol, estimamos que te llevará alrededor de {{averagePlaytime}} horas completarlo."
Genera la respuesta estrictamente en el formato JSON solicitado.`,
});

const playtimePredictionFlow = ai.defineFlow(
  {
    name: 'playtimePredictionFlow',
    inputSchema: PlaytimePredictionInputSchema,
    outputSchema: PlaytimePredictionOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    // Add a fallback if the AI returns an empty or unhelpful prediction
    if (!output?.prediction || output.prediction.trim().length < 5) {
        return { prediction: `Dado tu historial, estimamos que podría llevarte alrededor de ${input.averagePlaytime} horas completarlo.` };
    }
    return output;
  }
);
