
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
      Seja claro, objetivo e amigável em suas respostas. Use formatação Markdown para apresentar dados como tabelas e listas quando for apropriado.

      Pergunta do cliente: "${query}"
      `,
      tools: [getDataTool],
      model: 'googleai/gemini-1.5-flash-preview',
    });

    const toolResponse = llmResponse.toolRequest();

    // If the model doesn't request a tool, just return its text response.
    if (!toolResponse) {
       return { answer: llmResponse.text() };
    }
    
    // Execute the tool and get the result.
    const toolResult = await toolResponse.execute();

    // Call the AI again with the data from the tool to formulate a final answer.
    const finalResponse = await ai.generate({
        prompt: `Com base nos dados a seguir, responda à pergunta do cliente de forma clara e amigável.
        Se os dados estiverem vazios ou indicarem um erro, informe ao cliente de forma útil que a informação não foi encontrada e sugira que ele reformule a pergunta.

        Pergunta: "${query}"
        
        Dados Obtidos da Ferramenta:
        ${JSON.stringify(toolResult, null, 2)}
        `,
        model: 'googleai/gemini-1.5-flash-preview',
    });


    return { answer: finalResponse.text() };
  }
);
