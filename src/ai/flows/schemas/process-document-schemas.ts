

import { z } from 'zod';

const ItemSchema = z.object({
    description: z.string().describe('The detailed description of the item.'),
    quantity: z.number().describe('The quantity of the item.'),
    unitPrice: z.coerce.number().describe('The estimated unit price for the item. The AI must estimate a reasonable market price based on the description in BRL.'),
});

export const ProcessDocumentInputSchema = z.object({
  documentDataUri: z
    .string()
    .describe(
      "A photo of a document (e.g., business card, handwritten note, or formal invoice), as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type ProcessDocumentInput = z.infer<typeof ProcessDocumentInputSchema>;


export const ProcessDocumentOutputSchema = z.object({
  recipient: z.object({
    name: z.string().describe("The recipient's full name or company name."),
    document: z.string().describe("The recipient's document number (CPF or CNPJ)."),
    address: z.string().describe("The recipient's full address."),
  }).describe("The extracted recipient information."),
  items: z.array(ItemSchema).describe("An array of invoice items extracted from the document. If no items are found, this can be empty.")
});
export type ProcessDocumentOutput = z.infer<typeof ProcessDocumentOutputSchema>;
