import { z } from 'genkit';

export const GenerateInvoiceEmailInputSchema = z.object({
  clientName: z.string().describe('O nome do cliente.'),
  invoiceDate: z.string().describe('A data de emissão da nota fiscal.'),
  invoiceValue: z.string().describe('O valor total da nota fiscal.'),
  invoiceKey: z.string().describe('A chave de acesso da nota fiscal.'),
  companyName: z.string().describe('O nome da empresa que está enviando a nota.'),
});
export type GenerateInvoiceEmailInput = z.infer<
  typeof GenerateInvoiceEmailInputSchema
>;

export const GenerateInvoiceEmailOutputSchema = z.object({
  subject: z.string().describe('O assunto do e-mail.'),
  body: z.string().describe('O corpo do e-mail em formato HTML. Deve ser um HTML bem formatado e pronto para ser renderizado.'),
});
export type GenerateInvoiceEmailOutput = z.infer<
  typeof GenerateInvoiceEmailOutputSchema
>;
