
import { z } from 'genkit';

export const GenerateAvatarInputSchema = z.object({
  name: z.string().describe("The client's name to generate an avatar for."),
});
export type GenerateAvatarInput = z.infer<typeof GenerateAvatarInputSchema>;

export const GenerateAvatarOutputSchema = z.object({
  avatarUrl: z
    .string()
    .describe('The generated avatar image as a data URI.'),
});
export type GenerateAvatarOutput = z.infer<typeof GenerateAvatarOutputSchema>;
