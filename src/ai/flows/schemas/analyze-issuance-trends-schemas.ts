
import {z} from 'genkit';

export const AnalyzeIssuanceTrendsInputSchema = z.object({
  volume: z.number().describe('The total volume of notas issued.'),
  averageValue: z.number().describe('The average value of notas issued.'),
  trends: z.string().describe('A description of the recent trends in nota issuance.'),
});
export type AnalyzeIssuanceTrendsInput = z.infer<typeof AnalyzeIssuanceTrendsInputSchema>;

export const AnalyzeIssuanceTrendsOutputSchema = z.object({
  insights: z.string().describe('Insights into the nota issuance trends, volume, and values.'),
  suggestions: z.string().describe('Suggestions on how to improve based on the analysis.'),
});
export type AnalyzeIssuanceTrendsOutput = z.infer<typeof AnalyzeIssuanceTrendsOutputSchema>;
