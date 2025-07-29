
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
      prompt: `Você é um analista de negócios expert. Sua tarefa é responder perguntas sobre dados de faturamento e clientes.
      Use a ferramenta 'getData' para buscar as informações necessárias.
      Seja claro e direto em suas respostas. Use formatação Markdown para tabelas e listas quando apropriado.

      Pergunta do usuário: "${query}"
      `,
      tools: [getDataTool],
      model: 'googleai/gemini-1.5-flash-preview',
    });

    const toolResponse = llmResponse.toolRequest();

    if (!toolResponse) {
       return { answer: llmResponse.text() };
    }
    
    const toolResult = await toolResponse.execute();

    const finalResponse = await ai.generate({
        prompt: `Com base nos dados a seguir, responda a pergunta do usuário.

        Pergunta: "${query}"
        Dados:
        ${JSON.stringify(toolResult, null, 2)}
        `,
        model: 'googleai/gemini-1.5-flash-preview',
    });


    return { answer: finalResponse.text() };
  }
);
