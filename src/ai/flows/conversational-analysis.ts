
'use server';

/**
 * @fileOverview A flow that answers business questions by querying and acting on data.
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
import { cancelInvoiceTool, reissueInvoiceTool } from './tools/manageInvoices';


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
  async ({ query, history }) => {
    
    const llmResponse = await ai.generate({
      prompt: `Você é um "Assistente Fiscal" de IA. Sua tarefa é responder a perguntas de clientes e executar ações sobre suas notas fiscais, faturas e dados de faturamento.
      
      Ferramentas Disponíveis:
      - 'getData': Use esta ferramenta para buscar as informações necessárias para responder a perguntas sobre dados. A busca é sempre feita no contexto do usuário que está fazendo a pergunta.
      - 'cancelInvoiceTool': Use esta ferramenta para cancelar uma nota fiscal. Você deve sempre pedir confirmação ao usuário antes de executar a ação de cancelamento.
      - 'reissueInvoiceTool': Use esta ferramenta para reemitir (duplicar) uma nota fiscal.

      Instruções:
      1. Se a pergunta for uma consulta de dados, use a ferramenta 'getData'.
      2. Se a solicitação for para cancelar ou reemitir uma nota, use a ferramenta apropriada ('cancelInvoiceTool' ou 'reissueInvoiceTool').
      3. IMPORTANTE: Para ações destrutivas como o cancelamento, sempre peça a confirmação do usuário antes de prosseguir. O fluxo da conversa deve ser: Pergunta do usuário -> Resposta da IA pedindo confirmação -> Mensagem de confirmação do usuário -> Execução da ferramenta.
      4. Se uma ferramenta retornar um erro ou dados vazios, analise o resultado e informe ao cliente de forma amigável que a informação não foi encontrada ou a ação não pôde ser concluída.
      5. Seja claro, objetivo e amigável em suas respostas. Use formatação Markdown para apresentar dados como tabelas e listas quando for apropriado.

      Histórico da Conversa:
      ${(history ?? []).map(msg => `${msg.role}: ${msg.content}`).join('\n')}

      Pergunta/Comando do cliente: "${query}"
      `,
      tools: [getDataTool, cancelInvoiceTool, reissueInvoiceTool],
      model: 'googleai/gemini-1.5-flash-preview',
    });

    return { answer: llmResponse.text };
  }
);
