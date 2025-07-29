
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
    .record(z.string().optional())
    .describe('A record of extracted data fields from the document. The keys should be in lowercase and without accents, e.g., "nome", "cpf", "rg", "cnh".'),
});
export type SmartDataCaptureOutput = z.infer<typeof SmartDataCaptureOutputSchema>;

export async function smartDataCapture(input: SmartDataCaptureInput): Promise<SmartDataCaptureOutput> {
  return smartDataCaptureFlow(input);
}

const prompt = ai.definePrompt({
  name: 'smartDataCapturePrompt',
  input: {schema: SmartDataCaptureInputSchema},
  output: {schema: SmartDataCaptureOutputSchema},
  prompt: `You are an expert data extraction specialist. Your task is to extract information from a document image and return it as a structured JSON object.

The user has specified that the document type is: {{{documentType}}}.

Analyze the following document image and extract the key information.
{{media url=documentDataUri}}

Please extract the following fields if available:
- Full Name (key: "nome")
- CPF number (key: "cpf")
- RG number (key: "rg")
- CNH number (key: "cnh")
- Date of Birth (key: "data_nascimento")
- Filiation/Parents' names (key: "filiacao")

Return the extracted data in a JSON object, using only the specified lowercase keys. If a field is not found, do not include it in the output.
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
    if (!output) {
      throw new Error('AI failed to return valid output.');
    }
    return output;
  }
);
