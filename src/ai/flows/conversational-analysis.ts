
'use server';

/**
 * @fileOverview A flow that answers business questions by querying data.
 *
 * - conversationalAnalysis - A function that handles the conversation.
 * - ConversationalAnalysisInput - The input type for the function.
 * - ConversationalAnalysisOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import {
    ConversationalAnalysisInputSchema,
    ConversationalAnalysisOutputSchema,
    type ConversationalAnalysisInput,
    type ConversationalAnalysisOutput
} from './schemas/conversational-analysis-schemas';
import { getDataTool } from './tools/getData';


export async function conversationalAnalysis(
  input: ConversationalAnalysisInput
): Promise<ConversationalAnalysisOutput> {
  return conversationalAnalysisFlow(input);
}


const conversationalAnalysisFlow = ai.defineFlow(
  {
    name: 'conversationalAnalysisFlow',
    inputSchema: ConversationalAnalysisInputSchema,
    outputSchema: ConversationalAnalysisOutputSchema,
  },
  async ({ query }) => {
    
    const llmResponse = await ai.generate({
      prompt: `Você é um "Assistente Fiscal" de IA. Sua tarefa é responder a perguntas de clientes sobre suas notas fiscais, faturas e dados de faturamento.
      Use a ferramenta 'getData' para buscar as informações necessárias para responder à pergunta.
      Se a ferramenta retornar um erro ou dados vazios, analise o resultado e informe ao cliente de forma amigável que a informação não foi encontrada, sugerindo que ele reformule a pergunta ou tente outra consulta.
      Seja claro, objetivo e amigável em suas respostas. Use formatação Markdown para apresentar dados como tabelas e listas quando for apropriado.

      Pergunta do cliente: "${query}"
      `,
      tools: [getDataTool],
      model: 'googleai/gemini-1.5-flash-preview',
    });

    return { answer: llmResponse.text() };
  }
);
