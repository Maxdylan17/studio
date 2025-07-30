
import { z } from 'genkit';

export const GenerateAvatarInputSchema = z.object({
  name: z.string().describe("The client's name, used for context."),
  prompt: z.string().optional().describe("An optional, user-provided description for generating a more specific avatar."),
});
export type GenerateAvatarInput = z.infer<typeof GenerateAvatarInputSchema>;

export const GenerateAvatarOutputSchema = z.object({
  avatarUrl: z
    .string()
    .describe('The generated avatar image as a data URI.'),
});
export type GenerateAvatarOutput = z.infer<typeof GenerateAvatarOutputSchema>;
