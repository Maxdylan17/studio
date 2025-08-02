
'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { handleProcessDocument } from '@/lib/actions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import type { ExtractedData } from '@/lib/definitions';
import { RefreshCw, Upload, ScanSearch } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

interface AiCaptureProps {
  onExtractionComplete: (data: ExtractedData) => void;
}

export function AiCapture({ onExtractionComplete }: AiCaptureProps) {
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { toast } = useToast();

  const processDataUri = async (dataUri: string) => {
    setLoading(true);
    try {
       const result = await handleProcessDocument({ documentDataUri: dataUri });
       if (!result.recipient?.name && !result.recipient?.document && (!result.items || result.items.length === 0)) {
            toast({
                variant: 'destructive',
                title: 'Dados não encontrados',
                description: 'Não foi possível extrair informações do documento. Tente uma imagem mais nítida.',
            });
       } else {
            toast({
                title: 'Dados Extraídos!',
                description: 'As informações foram processadas e preenchidas no formulário.',
            });
            onExtractionComplete({
                recipient: {
                    name: result.recipient.name,
                    document: result.recipient.document,
                    address: result.recipient.address,
                },
                items: result.items || []
            });
       }
     } catch (error) {
       toast({
         variant: 'destructive',
         title: 'Erro na Extração',
         description: 'Não foi possível extrair os dados do documento. Tente novamente.',
       });
       console.error(error);
     } finally {
       setLoading(false);
     }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
        setFile(selectedFile);
        const reader = new FileReader();
        reader.readAsDataURL(selectedFile);
        reader.onload = () => {
          processDataUri(reader.result as string);
        };
        reader.onerror = (error) => {
            console.error("Error reading file:", error);
            toast({variant: 'destructive', title: 'Erro ao ler arquivo'});
        }
    }
  };

  const handleProcessFile = () => {
    if (!file) {
      toast({ variant: 'destructive', title: 'Nenhum arquivo selecionado' });
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUri = e.target?.result as string;
      if (dataUri) {
        processDataUri(dataUri);
      }
    };
    reader.readAsDataURL(file);
  }

  return (
    <Card>
        <CardHeader>
            <CardTitle className="flex items-center gap-2">
                <ScanSearch className="h-6 w-6 text-primary" />
                Processar Documento com IA
            </CardTitle>
            <CardDescription>
                Envie um documento (nota, cartão de visita, rascunho) para extrair dados do cliente e itens.
            </CardDescription>
        </CardHeader>
        <CardContent>
            <div className="space-y-4">
                 <div className="grid grid-cols-1 gap-4">
                     <Button asChild size="lg" variant="secondary">
                        <label className='cursor-pointer'>
                            <Upload className="mr-2 h-4 w-4" />
                            {file ? 'Trocar Documento' : 'Selecionar Documento'}
                            <input type="file" accept="image/*,application/pdf" className="sr-only" ref={fileInputRef} onChange={handleFileChange} />
                        </label>
                    </Button>
                </div>
                 {file && (
                    <div className="text-center p-4 border rounded-md bg-muted/50 space-y-3">
                        <p className="text-sm font-medium">Arquivo selecionado: {file.name}</p>
                        <Button onClick={handleProcessFile} disabled={loading} size="lg">
                            {loading ? (
                                <>
                                 <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                                  Analisando...
                                </>
                            ): (
                                <>
                                    <ScanSearch className="mr-2 h-4 w-4" />
                                    Processar Documento
                                </>
                            )}
                         </Button>
                    </div>
                 )}
            </div>
        </CardContent>
    </Card>
  );
}
