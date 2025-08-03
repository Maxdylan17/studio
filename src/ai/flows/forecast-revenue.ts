
'use server';

/**
 * @fileOverview A flow that forecasts future revenue based on historical data.
 *
 * - forecastRevenue - A function that analyzes historical data and provides a revenue forecast.
 * - ForecastRevenueInput - The input type for the function.
 * - ForecastRevenueOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const MonthlyRevenueSchema = z.object({
    year: z.number().describe('The year of the revenue data.'),
    month: z.string().describe('The month of the revenue data (e.g., "Jan", "Fev").'),
    revenue: z.number().describe('The total revenue for that month.'),
});

export const ForecastRevenueInputSchema = z.object({
  historicalData: z.array(MonthlyRevenueSchema).describe('An array of past monthly revenues.'),
  forecastPeriods: z.number().default(3).describe('The number of future months to forecast.'),
});
export type ForecastRevenueInput = z.infer<typeof ForecastRevenueInputSchema>;

const ForecastedMonthSchema = z.object({
    period: z.string().describe('The forecasted period (e.g., "Próximo Mês", "Em 2 Meses").'),
    revenue: z.string().describe('The forecasted revenue amount as a formatted string (e.g., "R$ 10.500,00").'),
});

export const ForecastRevenueOutputSchema = z.object({
  forecast: z.array(ForecastedMonthSchema).describe('An array of forecasted revenue for the upcoming periods.'),
  analysis: z.string().describe('A brief analysis explaining the reasoning behind the forecast, considering trends and seasonality.'),
});
export type ForecastRevenueOutput = z.infer<typeof ForecastRevenueOutputSchema>;

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
