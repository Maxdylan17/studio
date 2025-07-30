
'use server';

/**
 * @fileOverview A flow that converts a natural language description into structured invoice items.
 *
 * - smartIssuance - A function that handles the conversion.
 * - SmartIssuanceInput - The input type for the smartIssuance function.
 * - SmartIssuanceOutput - The return type for the smartIssuance function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SmartIssuanceInputSchema = z.object({
  description: z.string().describe('The natural language description of the services or products.'),
});
export type SmartIssuanceInput = z.infer<typeof SmartIssuanceInputSchema>;

const InvoiceItemSchema = z.object({
    description: z.string().describe('The detailed description of the item.'),
    quantity: z.number().describe('The quantity of the item.'),
    unitPrice: z.coerce.number().describe('The estimated unit price for the item. The AI must estimate a reasonable market price based on the description.'),
});

const SmartIssuanceOutputSchema = z.object({
  items: z.array(InvoiceItemSchema).describe('An array of invoice items generated from the description.'),
});
export type SmartIssuanceOutput = z.infer<typeof SmartIssuanceOutputSchema>;

export async function smartIssuance(input: SmartIssuanceInput): Promise<SmartIssuanceOutput> {
  return smartIssuanceFlow(input);
}

const prompt = ai.definePrompt({
  name: 'smartIssuancePrompt',
  input: {schema: SmartIssuanceInputSchema},
  output: {schema: SmartIssuanceOutputSchema},
  prompt: `You are a billing specialist and market expert. Your task is to break down a service or product description into a structured list of invoice items.
You must also estimate a fair and realistic market price for each item based on its description, in the local currency (BRL).

The user's description is:
"{{{description}}}"

Break this down into individual items. For each item, provide a clear description, a quantity, and a reasonable estimated unit price.
Return the result as a structured JSON object.
`,
});

const smartIssuanceFlow = ai.defineFlow(
  {
    name: 'smartIssuanceFlow',
    inputSchema: SmartIssuanceInputSchema,
    outputSchema: SmartIssuanceOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    if (!output) {
      throw new Error('AI failed to return valid output.');
    }
    return output;
  }
);
