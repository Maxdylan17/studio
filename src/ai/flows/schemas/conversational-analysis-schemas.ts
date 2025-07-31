import { z } from 'genkit';

const MessageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string(),
});

export const ConversationalAnalysisInputSchema = z.object({
  query: z.string().describe('The user question or command about their business data.'),
  history: z.array(MessageSchema).optional().describe('The conversation history.'),
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
