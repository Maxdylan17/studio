
import {z} from 'genkit';

export const SmartIssuanceInputSchema = z.object({
  description: z.string().describe('The natural language description of the services or products.'),
});
export type SmartIssuanceInput = z.infer<typeof SmartIssuanceInputSchema>;

const InvoiceItemSchema = z.object({
    description: z.string().describe('The detailed description of the item.'),
    quantity: z.number().describe('The quantity of the item.'),
    unitPrice: z.coerce.number().describe('The estimated unit price for the item. The AI must estimate a reasonable market price based on the description in BRL.'),
});

export const SmartIssuanceOutputSchema = z.object({
  items: z.array(InvoiceItemSchema).describe('An array of invoice items generated from the description.'),
});
export type SmartIssuanceOutput = z.infer<typeof SmartIssuanceOutputSchema>;
