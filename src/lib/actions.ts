
'use server';

import { analyzeIssuanceTrends } from '@/ai/flows/analyze-issuance-trends';
import { smartDataCapture } from '@/ai/flows/smart-data-capture';
import { smartIssuance } from '@/ai/flows/smart-issuance';
import { conversationalAnalysis } from '@/ai/flows/conversational-analysis';
import { generateAvatar } from '@/ai/flows/generate-avatar';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from './firebase';

import type {
  AnalyzeIssuanceTrendsInput,
  AnalyzeIssuanceTrendsOutput,
} from '@/ai/flows/analyze-issuance-trends';
import type {
  SmartDataCaptureInput,
  SmartDataCaptureOutput,
} from '@/ai/flows/smart-data-capture';
import type {
    SmartIssuanceInput,
    SmartIssuanceOutput
} from '@/ai/flows/smart-issuance';
import type {
    ConversationalAnalysisInput,
    ConversationalAnalysisOutput
} from '@/ai/flows/schemas/conversational-analysis-schemas';
import type { GenerateAvatarInput } from '@/ai/flows/schemas/generate-avatar-schemas';


export async function handleAnalyzeIssuanceTrends(
  input: AnalyzeIssuanceTrendsInput
): Promise<AnalyzeIssuanceTrendsOutput> {
  try {
    const result = await analyzeIssuanceTrends(input);
    return result;
  } catch (error) {
    console.error('Error analyzing issuance trends:', error);
    throw new Error('Failed to analyze issuance trends.');
  }
}

export async function handleSmartDataCapture(
  input: SmartDataCaptureInput
): Promise<SmartDataCaptureOutput> {
  try {
    const result = await smartDataCapture(input);
    return result;
  } catch (error) {
    console.error('Error with smart data capture:', error);
    throw new Error('Failed to extract data from document.');
  }
}

export async function handleSmartIssuance(
    input: SmartIssuanceInput
): Promise<SmartIssuanceOutput> {
    try {
        const result = await smartIssuance(input);
        return result;
    } catch (error) {
        console.error('Error with smart issuance:', error);
        throw new Error('Failed to generate items from description.');
    }
}

export async function handleConversationalAnalysis(
  input: ConversationalAnalysisInput
): Promise<ConversationalAnalysisOutput> {
  try {
    const result = await conversationalAnalysis(input);
    return result;
  } catch (error) {
    console.error('Error with conversational analysis:', error);
    throw new Error('Failed to process conversational query.');
  }
}


export async function handleGenerateAndUpdateAvatar(
  input: { clientId: string; name: string }
): Promise<void> {
  try {
    const { avatarUrl } = await generateAvatar({ name: input.name });
    
    if (avatarUrl) {
      const clientRef = doc(db, 'clients', input.clientId);
      await updateDoc(clientRef, {
        avatarUrl: avatarUrl,
      });
    }

  } catch (error) {
    console.error('Error generating and updating avatar:', error);
    // Don't throw error to the client, just log it.
    // The main operation (creating the client) was successful.
  }
}
