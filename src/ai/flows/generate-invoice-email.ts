
'use server';

/**
 * @fileOverview A flow to generate a professional email body for sending an invoice or a payment reminder.
 *
 * - generateInvoiceEmail - A function that generates the email content.
 * - GenerateInvoiceEmailInput - The input type for the function.
 * - GenerateInvoiceEmailOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import {
  GenerateInvoiceEmailInputSchema,
  GenerateInvoiceEmailOutputSchema,
  type GenerateInvoiceEmailInput,
  type GenerateInvoiceEmailOutput,
} from './schemas/generate-invoice-email-schemas';

export async function generateInvoiceEmail(
  input: GenerateInvoiceEmailInput
): Promise<GenerateInvoiceEmailOutput> {
  return generateInvoiceEmailFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateInvoiceEmailPrompt',
  input: { schema: GenerateInvoiceEmailInputSchema },
  output: { schema: GenerateInvoiceEmailOutputSchema },
  prompt: `Você é um assistente de faturamento. Sua tarefa é criar o corpo de um e-mail profissional em HTML para um cliente, com base no status da fatura.
O e-mail deve ser amigável, claro e usar um layout limpo com HTML.

Use as seguintes informações:
- Nome do Cliente: {{{clientName}}}
- Data da Fatura: {{{invoiceDate}}}
- Valor da Fatura: R$ {{{invoiceValue}}}
- Chave de Acesso: {{{invoiceKey}}}
- Nome da Empresa Remetente: {{{companyName}}}
- Status da Fatura: {{{status}}}

REGRAS:
1.  Se o status for 'pendente' ou 'vencida', o tom deve ser um lembrete amigável de pagamento.
    - O assunto deve ser "Lembrete de Vencimento: Fatura Eletrônica".
    - O corpo do e-mail deve mencionar que a fatura está pendente ou vencida e incluir os detalhes para facilitar o pagamento.
2.  Para qualquer outro status (ou se o status não for 'pendente' ou 'vencida'), o tom é apenas de notificação.
    - O assunto deve ser "Sua Fatura Eletrônica está disponível".
    - O corpo do e-mail deve apenas informar que a fatura está disponível, sem menção a cobrança.

Em ambos os casos, o campo "body" do JSON de saída deve ser o conteúdo completo do e-mail em formato HTML. Não use markdown.
`,
});

const generateInvoiceEmailFlow = ai.defineFlow(
  {
    name: 'generateInvoiceEmailFlow',
    inputSchema: GenerateInvoiceEmailInputSchema,
    outputSchema: GenerateInvoiceEmailOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    if (!output) {
      throw new Error('AI failed to return valid output.');
    }
    return output;
  }
);
