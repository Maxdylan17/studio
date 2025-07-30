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
  prompt: `Você é um assistente de faturamento. Sua tarefa é criar o corpo de um e-mail profissional em HTML para enviar uma nota fiscal a um cliente.
O e-mail deve ser amigável, claro e usar um layout limpo com HTML.

Use as seguintes informações:
- Nome do Cliente: {{{clientName}}}
- Data da Nota: {{{invoiceDate}}}
- Valor da Nota: R$ {{{invoiceValue}}}
- Chave de Acesso: {{{invoiceKey}}}
- Nome da Empresa Remetente: {{{companyName}}}

O e-mail deve incluir:
1. Uma saudação ("Olá, [Nome do Cliente],").
2. Uma breve explicação de que a nota fiscal está disponível.
3. Os detalhes da nota de forma clara (Data, Valor, Chave de Acesso).
4. Uma despedida profissional (ex: "Atenciosamente,").
5. O nome da sua empresa na assinatura.

O campo "subject" do JSON de saída deve ser "Sua Nota Fiscal Eletrônica (NFS-e) está disponível".
O campo "body" do JSON de saída deve ser o conteúdo completo do e-mail em formato HTML. Não use markdown.
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
