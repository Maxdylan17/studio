'use server';

/**
 * @fileOverview A flow that provides insights into nota issuance trends, volume, and values, and suggests improvements using generative AI.
 *
 * - analyzeIssuanceTrends - A function that analyzes issuance trends and provides suggestions.
 * - AnalyzeIssuanceTrendsInput - The input type for the analyzeIssuanceTrends function.
 * - AnalyzeIssuanceTrendsOutput - The return type for the analyzeIssuanceTrends function.
 */

import {ai} from '@/ai/genkit';
import {
    AnalyzeIssuanceTrendsInputSchema,
    AnalyzeIssuanceTrendsOutputSchema,
    type AnalyzeIssuanceTrendsInput,
    type AnalyzeIssuanceTrendsOutput,
} from './schemas/analyze-issuance-trends-schemas';

export async function analyzeIssuanceTrends(input: AnalyzeIssuanceTrendsInput): Promise<AnalyzeIssuanceTrendsOutput> {
  return analyzeIssuanceTrendsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeIssuanceTrendsPrompt',
  input: {schema: AnalyzeIssuanceTrendsInputSchema},
  output: {schema: AnalyzeIssuanceTrendsOutputSchema},
  prompt: `You are a business analytics expert specializing in nota fiscal issuance trends.

You will use this information to provide insights and suggestions on how to improve.

Volume: {{{volume}}}
Average Value: {{{averageValue}}}
Trends: {{{trends}}}

Provide insights into the nota issuance trends, volume, and values.  Then, provide concrete and actionable suggestions on how to improve based on the analysis.
`,
});

const analyzeIssuanceTrendsFlow = ai.defineFlow(
  {
    name: 'analyzeIssuanceTrendsFlow',
    inputSchema: AnalyzeIssuanceTrendsInputSchema,
    outputSchema: AnalyzeIssuanceTrendsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
