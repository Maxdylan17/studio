
'use client';

import { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Wand2, RefreshCw, Upload, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { handleSmartIssuance } from '@/lib/actions';
import { handleProcessDocument } from '@/lib/actions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { ExtractedData } from '@/lib/definitions';

interface AiIssuanceProps {
  onExtractionComplete: (data: ExtractedData) => void;
}

export function AiIssuance({ onExtractionComplete }: AiIssuanceProps) {
  const [loading, setLoading] = useState(false);
  const [description, setDescription] = useState('');
  const [activeTab, setActiveTab] = useState("text");
  const [file, setFile] = useState<File | null>(null);
  
  const { toast } = useToast();

  const processDataUri = async (dataUri: string) => {
    setLoading(true);
    try {
       const result = await handleProcessDocument({ documentDataUri: dataUri });
       if (!result.recipient?.name && !result.recipient?.document && (!result.items || result.items.length === 0)) {
            toast({
                variant: 'destructive',
                title: 'Dados não encontrados',
                description: 'Não foi possível extrair informações da imagem. Tente uma imagem mais nítida ou com mais detalhes.',
            });
       } else {
            toast({
                title: 'Dados Extraídos!',
                description: 'As informações foram processadas pela IA.',
            });
            onExtractionComplete({
                recipient: {
                    name: result.recipient?.name,
                    document: result.recipient?.document,
                    address: result.recipient?.address
                },
                items: result.items || []
            })
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
    }
  };


  const handleFileAndExtract = () => {
    if (!file) {
      toast({ variant: 'destructive', title: 'Nenhum arquivo selecionado' });
      return;
    }
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      processDataUri(reader.result as string);
    };
    reader.onerror = (error) => {
        toast({ variant: 'destructive', title: 'Erro ao ler arquivo', description: 'Não foi possível carregar o arquivo selecionado.' });
        console.error("Error reading file:", error);
    }
  }

  const handleGenerateItemsFromText = async () => {
    if (!description) {
      toast({
        variant: 'destructive',
        title: 'Descrição vazia',
        description: 'Por favor, descreva os itens ou serviços.',
      });
      return;
    }

    setLoading(true);

    try {
      const result = await handleSmartIssuance({ description });
      if (result.items && result.items.length > 0) {
        const itemsWithNumericPrices = result.items.map(item => ({
          ...item,
          unitPrice: typeof item.unitPrice === 'string' ? parseFloat(item.unitPrice) : item.unitPrice,
          quantity: typeof item.quantity === 'string' ? parseFloat(item.quantity) : item.quantity,
        }));
        onExtractionComplete({ recipient: {}, items: itemsWithNumericPrices });
        toast({
          title: 'Itens Gerados com Sucesso!',
          description: 'A lista de itens foi preenchida pela IA.',
        });
      } else {
         toast({
          variant: 'destructive',
          title: 'Nenhum item gerado',
          description: 'A IA não conseguiu identificar itens na descrição. Tente ser mais específico.',
        });
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erro na Geração',
        description: 'Não foi possível gerar os itens. Tente novamente.',
      });
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
        <CardHeader>
            <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-6 w-6 text-primary" />
                Emissão Inteligente
            </CardTitle>
            <CardDescription>
                Use a IA para preencher os dados da nota automaticamente. Descreva os serviços ou envie uma imagem do pedido.
            </CardDescription>
        </CardHeader>
        <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="text"><Wand2 className="mr-2 h-4 w-4"/> Texto</TabsTrigger>
                    <TabsTrigger value="image"><Upload className="mr-2 h-4 w-4" /> Imagem</TabsTrigger>
                </TabsList>
                <TabsContent value="text" className="mt-4">
                     <div className="grid w-full gap-2">
                        <Textarea
                            id="smart-description"
                            placeholder="Ex: Criação de um website institucional com 3 páginas, design responsivo, e um ano de hospedagem."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={5}
                        />
                        <Button onClick={handleGenerateItemsFromText} disabled={loading} size="lg">
                            {loading ? (
                                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <Wand2 className="mr-2 h-4 w-4" />
                            )}
                            {loading ? 'Gerando Itens...' : 'Gerar Itens e Preços com IA'}
                        </Button>
                    </div>
                </TabsContent>
                <TabsContent value="image" className="mt-4">
                   <div className="space-y-4">
                        <div className="grid grid-cols-1 gap-4">
                             <Button asChild size="lg" variant="secondary">
                                <label className='cursor-pointer'>
                                    <Upload className="mr-2 h-4 w-4" />
                                    {file ? "Trocar Imagem" : "Carregar Imagem"}
                                    <input type="file" accept="image/*" className="sr-only" onChange={handleFileChange} />
                                </label>
                            </Button>
                        </div>
                        {file && (
                             <div className="text-center p-4 border rounded-md bg-muted/50 space-y-3">
                                 <p className="text-sm font-medium">Arquivo selecionado: {file.name}</p>
                                 <Button onClick={handleFileAndExtract} disabled={loading}>
                                    {loading ? (
                                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                                    ) : (
                                      <Sparkles className="mr-2 h-4 w-4" />
                                    )}
                                     {loading ? 'Analisando...' : 'Extrair Dados do Arquivo'}
                                 </Button>
                            </div>
                        )}
                   </div>
                </TabsContent>
            </Tabs>
        </CardContent>
    </Card>
  );
}
