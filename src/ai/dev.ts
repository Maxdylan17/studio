
'use server';
import { config } from 'dotenv';
config();

import '@/ai/flows/analyze-issuance-trends.ts';
import '@/ai/flows/analyze-financial-trends.ts';
import '@/ai/flows/process-document-flow.ts';
import '@/ai/flows/conversational-analysis.ts';
import '@/ai/flows/generate-avatar.ts';
import '@/ai/flows/generate-invoice-email.ts';
import '@/ai/flows/smart-issuance.ts';
import '@/ai/flows/forecast-revenue.ts';
