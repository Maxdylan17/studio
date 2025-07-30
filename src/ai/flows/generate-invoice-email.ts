'use server';

/**
 * @fileOverview A flow to generate a professional email body for sending an invoice.
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
  prompt: `Você é um assistente de faturamento. Sua tarefa é criar o corpo de um e-mail profissional para enviar uma nota fiscal a um cliente.
O e-mail deve ser escrito em HTML, ser amigável, claro e incluir os detalhes da nota fiscal fornecida.

Use as seguintes informações:
- Nome do Cliente: {{{clientName}}}
- Data da Nota: {{{invoiceDate}}}
- Valor da Nota: R$ {{{invoiceValue}}}
- Chave de Acesso: {{{invoiceKey}}}

O e-mail deve incluir uma saudação, uma breve explicação de que a nota fiscal está em anexo (ou que os detalhes estão no e-mail), os detalhes da nota de forma clara, e uma despedida profissional.
O campo "subject" deve ser "Sua Nota Fiscal Eletrônica (NFS-e) está disponível".
O campo "body" deve ser o conteúdo HTML do e-mail.
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
