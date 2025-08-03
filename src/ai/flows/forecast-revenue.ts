
'use server';

/**
 * @fileOverview A flow that forecasts future revenue based on historical data.
 *
 * - forecastRevenue - A function that analyzes historical data and provides a revenue forecast.
 * - ForecastRevenueInput - The input type for the function.
 * - ForecastRevenueOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {
    ForecastRevenueInputSchema,
    ForecastRevenueOutputSchema,
    type ForecastRevenueInput,
    type ForecastRevenueOutput
} from './schemas/forecast-revenue-schemas';

export async function forecastRevenue(input: ForecastRevenueInput): Promise<ForecastRevenueOutput> {
  return forecastRevenueFlow(input);
}

const prompt = ai.definePrompt({
  name: 'forecastRevenuePrompt',
  input: {schema: ForecastRevenueInputSchema},
  output: {schema: ForecastRevenueOutputSchema},
  prompt: `You are an expert financial analyst AI specializing in revenue forecasting for small businesses.

Your task is to analyze the provided historical monthly revenue data and generate a realistic forecast for the next {{{forecastPeriods}}} months. You must also provide a brief analysis explaining your forecast.

Historical Data:
{{#each historicalData}}
- {{month}}/{{year}}: R$ {{revenue}}
{{/each}}

Instructions:
1.  **Analyze Trends**: Look for upward, downward, or stable trends in the data.
2.  **Identify Seasonality**: Check for recurring patterns (e.g., higher revenue in specific months).
3.  **Generate Forecast**: Based on your analysis, predict the revenue for the next {{{forecastPeriods}}} months. Present the forecasted values as formatted strings in BRL.
4.  **Provide Analysis**: Write a short, clear explanation of your reasoning. Mention the trends and seasonality you identified and how they influenced your prediction. The tone should be cautiously optimistic and helpful.

Return the result as a structured JSON object.
`,
});

const forecastRevenueFlow = ai.defineFlow(
  {
    name: 'forecastRevenueFlow',
    inputSchema: ForecastRevenueInputSchema,
    outputSchema: ForecastRevenueOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    if (!output) {
        throw new Error('AI failed to return a valid revenue forecast.');
    }
    return output;
  }
);
