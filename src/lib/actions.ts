
'use server';

import { analyzeIssuanceTrends } from '@/ai/flows/analyze-issuance-trends';
import { smartDataCapture } from '@/ai/flows/smart-data-capture';
import { smartIssuance } from '@/ai/flows/smart-issuance';

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
