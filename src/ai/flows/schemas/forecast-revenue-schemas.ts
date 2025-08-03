
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
