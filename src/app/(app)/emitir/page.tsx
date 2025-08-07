
'use client';

import { useState } from 'react';
import { IssuanceForm } from '@/components/emitir/issuance-form';
import { AiIssuance } from '@/components/emitir/smart-issuance';
import type { ExtractedData } from '@/lib/definitions';


export default function EmitirPage() {
  const [extractedData, setExtractedData] = useState<ExtractedData | null>(null);
  const [formKey, setFormKey] = useState(Date.now()); // Add a key to force re-mount

  const handleExtractionComplete = (data: ExtractedData) => {
    setExtractedData(data);
    setFormKey(Date.now()); // Update key to re-render form with new initialData
  };
  
  const handleReset = () => {
    setExtractedData(null);
    setFormKey(Date.now()); // Update key to re-render form from a clean state
  }

  return (
    <div className="space-y-4 p-4 sm:p-8 pt-6 animate-in fade-in-0">
      <div className="flex items-center justify-between space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Gerador NF-e</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <AiIssuance onExtractionComplete={handleExtractionComplete} />
        <IssuanceForm key={formKey} initialData={extractedData} onReset={handleReset} />
      </div>
    </div>
  );
}
