
'use server';

/**
 * @fileOverview A flow that processes a document image to extract both recipient data and invoice items.
 *
 * - processDocument - A function that handles the unified data extraction.
 */

import {ai} from '@/ai/genkit';
import {
    ProcessDocumentInputSchema, 
    ProcessDocumentOutputSchema, 
    type ProcessDocumentInput, 
    type ProcessDocumentOutput
} from './schemas/process-document-schemas';


export async function processDocument(input: ProcessDocumentInput): Promise<ProcessDocumentOutput> {
  return processDocumentFlow(input);
}

const prompt = ai.definePrompt({
  name: 'processDocumentPrompt',
  input: {schema: ProcessDocumentInputSchema},
  output: {schema: ProcessDocumentOutputSchema},
  prompt: `You are an expert data extraction AI. Your task is to analyze an image of a document and return structured information for an invoice. The document could be anything from a formal invoice, a business card, to a handwritten note.

Analyze the following document image:
{{media url=documentDataUri}}

Extract the following information:
1.  **Recipient Data**: Identify the name, document number (CPF/CNPJ), and address of the client or recipient.
2.  **Invoice Items**: Identify all products or services listed. For each item, determine its description, quantity, and estimate a realistic market unit price in BRL.

Return the extracted data as a single, structured JSON object. If some information (e.g., invoice items) is not present in the image, return the corresponding field as an empty array or with empty fields, but always extract any available recipient information.
`,
});

const processDocumentFlow = ai.defineFlow(
  {
    name: 'processDocumentFlow',
    inputSchema: ProcessDocumentInputSchema,
    outputSchema: ProcessDocumentOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    if (!output) {
      throw new Error('AI failed to return valid output.');
    }
    return output;
  }
);
