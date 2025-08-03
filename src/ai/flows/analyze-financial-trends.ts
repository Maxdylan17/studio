
'use server';

/**
 * @fileOverview A flow that provides insights into financial trends by analyzing revenue and expenses.
 *
 * - analyzeFinancialTrends - A function that analyzes financial trends and provides suggestions.
 * - AnalyzeFinancialTrendsInput - The input type for the function.
 * - AnalyzeFinancialTrendsOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {
    AnalyzeFinancialTrendsInputSchema,
    AnalyzeFinancialTrendsOutputSchema,
    type AnalyzeFinancialTrendsInput,
    type AnalyzeFinancialTrendsOutput
} from './schemas/analyze-financial-trends-schemas';


export async function analyzeFinancialTrends(input: AnalyzeFinancialTrendsInput): Promise<AnalyzeFinancialTrendsOutput> {
  return analyzeFinancialTrendsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeFinancialTrendsPrompt',
  input: {schema: AnalyzeFinancialTrendsInputSchema},
  output: {schema: AnalyzeFinancialTrendsOutputSchema},
  prompt: `You are an expert financial analyst for small businesses and freelancers.

You will receive financial data for a specific period. Your task is to provide sharp, concise insights and actionable suggestions.

Analyze the following data:
- Total Revenue: R$ {{{totalRevenue}}}
- Total Expenses: R$ {{{totalExpenses}}}
- Revenue Trends: {{{revenueTrends}}}
- Expense Trends: {{{expenseTrends}}}

Based on this, generate:
1.  **Insights**: Comment on the profitability (revenue vs. expenses), identify the most significant financial trends, and highlight any potential red flags or positive signals.
2.  **Suggestions**: Provide concrete, actionable advice. For example, if expenses are high, suggest specific areas for cost reduction. If revenue is growing, suggest strategies to maintain momentum.
`,
});

const analyzeFinancialTrendsFlow = ai.defineFlow(
  {
    name: 'analyzeFinancialTrendsFlow',
    inputSchema: AnalyzeFinancialTrendsInputSchema,
    outputSchema: AnalyzeFinancialTrendsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    if (!output) {
        throw new Error('AI failed to return valid financial analysis.');
    }
    return output;
  }
);
