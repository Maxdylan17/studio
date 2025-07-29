import { z } from 'genkit';

export const ConversationalAnalysisInputSchema = z.object({
  query: z.string().describe('The user question about their business data.'),
});
export type ConversationalAnalysisInput = z.infer<
  typeof ConversationalAnalysisInputSchema
>;

export const ConversationalAnalysisOutputSchema = z.object({
  answer: z.string().describe('The answer to the user question in Markdown format.'),
});
export type ConversationalAnalysisOutput = z.infer<
  typeof ConversationalAnalysisOutputSchema
>;
