'use server';

/**
 * @fileOverview Smart Data Capture AI agent.
 *
 * - smartDataCapture - A function that handles the data extraction from documents using OCR and generative AI.
 * - SmartDataCaptureInput - The input type for the smartDataCapture function.
 * - SmartDataCaptureOutput - The return type for the smartDataCapture function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SmartDataCaptureInputSchema = z.object({
  documentDataUri: z
    .string()
    .describe(
      "A photo of a document (RG, CNH, etc.), as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  documentType: z
    .string()
    .describe('The type of document being processed (e.g., RG, CNH).'),
});
export type SmartDataCaptureInput = z.infer<typeof SmartDataCaptureInputSchema>;

const SmartDataCaptureOutputSchema = z.object({
  extractedData: z
    .record(z.string())
    .describe('A record of extracted data fields from the document.'),
});
export type SmartDataCaptureOutput = z.infer<typeof SmartDataCaptureOutputSchema>;

export async function smartDataCapture(input: SmartDataCaptureInput): Promise<SmartDataCaptureOutput> {
  return smartDataCaptureFlow(input);
}

const prompt = ai.definePrompt({
  name: 'smartDataCapturePrompt',
  input: {schema: SmartDataCaptureInputSchema},
  output: {schema: SmartDataCaptureOutputSchema},
  prompt: `You are an expert data extraction specialist.

You will use OCR and generative AI to extract data from the provided document image.

The document type is: {{{documentType}}}

Extract the relevant data fields from the following document image:
{{media url=documentDataUri}}

Output the extracted data as a JSON object.
`,
});

const smartDataCaptureFlow = ai.defineFlow(
  {
    name: 'smartDataCaptureFlow',
    inputSchema: SmartDataCaptureInputSchema,
    outputSchema: SmartDataCaptureOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
