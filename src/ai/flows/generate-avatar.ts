
'use server';

/**
 * @fileOverview A flow to generate a unique avatar for a client.
 *
 * - generateAvatar - A function that generates an avatar based on a client's name.
 * - GenerateAvatarInput - The input type for the function.
 * - GenerateAvatarOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import {
  GenerateAvatarInputSchema,
  GenerateAvatarOutputSchema,
  type GenerateAvatarInput,
  type GenerateAvatarOutput,
} from './schemas/generate-avatar-schemas';


export async function generateAvatar(
  input: GenerateAvatarInput
): Promise<GenerateAvatarOutput> {
  return generateAvatarFlow(input);
}

const generateAvatarFlow = ai.defineFlow(
  {
    name: 'generateAvatarFlow',
    inputSchema: GenerateAvatarInputSchema,
    outputSchema: GenerateAvatarOutputSchema,
  },
  async ({ name }) => {
    const { media } = await ai.generate({
      model: 'googleai/gemini-2.0-flash-preview-image-generation',
      prompt: `Generate an abstract, minimalist, and professional logo for a company named "${name}". Use a clean, vector style with a simple color palette. The logo should be symbolic and not include any text.`,
      config: {
        responseModalities: ['TEXT', 'IMAGE'],
      },
    });

    if (!media || !media.url) {
      throw new Error('Image generation failed.');
    }

    return { avatarUrl: media.url };
  }
);
