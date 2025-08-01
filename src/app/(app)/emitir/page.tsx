
'use client';

import { useState } from 'react';
import { IssuanceForm } from '@/components/emitir/issuance-form';
import { AiIssuance } from '@/components/emitir/ai-issuance';
import type { ExtractedData } from '@/lib/definitions';


export default function EmitirPage() {
  const [extractedData, setExtractedData] = useState<ExtractedData | null>(null);
  const [showForm, setShowForm] = useState(false);

  const handleExtractionComplete = (data: ExtractedData) => {
    setExtractedData(data);
    setShowForm(true);
  };
  
  const handleReset = () => {
    setExtractedData(null);
    setShowForm(false);
  }

  return (
    <div className="space-y-4 p-4 sm:p-8 pt-6 animate-in fade-in-0">
      <div className="flex items-center justify-between space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Gerador NF-e</h1>
      </div>

      {!showForm ? (
         <AiIssuance onExtractionComplete={handleExtractionComplete} />
      ) : (
         <IssuanceForm initialData={extractedData} onReset={handleReset} />
      )}
    </div>
  );
}
