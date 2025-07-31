
'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { handleSmartDataCapture } from '@/lib/actions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import type { ExtractedClientData } from '@/lib/definitions';
import { RefreshCw, Upload, ScanSearch } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

interface AiCaptureProps {
  onExtractionComplete: (data: ExtractedClientData) => void;
}

export function AiCapture({ onExtractionComplete }: AiCaptureProps) {
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState('CNH');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { toast } = useToast();

  const processDataUri = async (dataUri: string) => {
    setLoading(true);
    try {
       const result = await handleSmartDataCapture({ documentDataUri: dataUri, documentType });
       if (Object.keys(result.extractedData).length === 0) {
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
            onExtractionComplete(result.extractedData);
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
                Extrair Dados de Documento
            </CardTitle>
            <CardDescription>
                Envie um documento de identificação para cadastrar um novo cliente automaticamente.
            </CardDescription>
        </CardHeader>
        <CardContent>
            <div className="space-y-4">
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Select value={documentType} onValueChange={setDocumentType}>
                        <SelectTrigger>
                            <SelectValue placeholder="Selecione o tipo" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="CNH">CNH</SelectItem>
                            <SelectItem value="RG">RG</SelectItem>
                            <SelectItem value="Outro">Outro</SelectItem>
                        </SelectContent>
                    </Select>
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
