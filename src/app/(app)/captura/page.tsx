
'use client';

import { useState } from 'react';
import { AiCapture } from '@/components/captura/ai-capture';
import { CaptureForm } from '@/components/captura/capture-form';
import type { ExtractedData } from '@/lib/definitions';


export default function CapturaPage() {
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
        <h1 className="text-3xl font-bold tracking-tight">Captura Inteligente</h1>
      </div>

      {!showForm ? (
         <AiCapture onExtractionComplete={handleExtractionComplete} />
      ) : (
         <CaptureForm initialData={extractedData} onReset={handleReset} />
      )}
    </div>
  );
}
