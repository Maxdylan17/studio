
import {z} from 'genkit';

export const AnalyzeFinancialTrendsInputSchema = z.object({
  totalRevenue: z.number().describe('The total revenue for the period.'),
  totalExpenses: z.number().describe('The total expenses for the period.'),
  revenueTrends: z.string().describe('A summary of recent revenue trends.'),
  expenseTrends: z.string().describe('A summary of recent expense trends.'),
});
export type AnalyzeFinancialTrendsInput = z.infer<typeof AnalyzeFinancialTrendsInputSchema>;

export const AnalyzeFinancialTrendsOutputSchema = z.object({
  insights: z.string().describe('Key insights into financial health, profitability, and spending patterns.'),
  suggestions: z.string().describe('Actionable suggestions for cost optimization or revenue growth.'),
});
export type AnalyzeFinancialTrendsOutput = z.infer<typeof AnalyzeFinancialTrendsOutputSchema>;
