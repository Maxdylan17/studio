
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Wand2, RefreshCw, Upload, Sparkles, Image as ImageIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { handleProcessDocument, handleSmartIssuance } from '@/lib/actions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { ExtractedData } from '@/lib/definitions';

interface AiIssuanceProps {
  onExtractionComplete: (data: ExtractedData) => void;
}

export function AiIssuance({ onExtractionComplete }: AiIssuanceProps) {
  const [loading, setLoading] = useState(false);
  const [description, setDescription] = useState('');
  const [file, setFile] = useState<File | null>(null);
  
  const { toast } = useToast();

  const processImage = async (dataUri: string) => {
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
       setFile(null);
     }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
        setFile(selectedFile);
        const reader = new FileReader();
        reader.readAsDataURL(selectedFile);
        reader.onload = () => {
          processImage(reader.result as string);
        };
        reader.onerror = (error) => {
            console.error("Error reading file:", error);
            toast({variant: 'destructive', title: 'Erro ao ler arquivo'});
        }
    }
  };


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
                Use a IA para preencher os dados da nota. Extraia de uma imagem ou gere a partir de um texto.
            </CardDescription>
        </CardHeader>
        <CardContent>
            <Tabs defaultValue="image" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="image"><ImageIcon className="mr-2 h-4 w-4" /> Imagem</TabsTrigger>
                    <TabsTrigger value="text"><Wand2 className="mr-2 h-4 w-4"/> Texto</TabsTrigger>
                </TabsList>
                <TabsContent value="image" className="mt-4">
                   <div className="space-y-4">
                        <Button asChild size="lg" variant="secondary" className="w-full" disabled={loading}>
                            <label className='cursor-pointer'>
                                {loading ? (
                                    <>
                                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                                        Processando...
                                    </>
                                ) : (
                                    <>
                                        <Upload className="mr-2 h-4 w-4" />
                                        Carregar Imagem do Documento
                                    </>
                                )}
                                <input type="file" accept="image/*" className="sr-only" onChange={handleFileChange} disabled={loading}/>
                            </label>
                        </Button>
                        <p className="text-xs text-center text-muted-foreground">Envie uma imagem de um pedido, rascunho ou cartão de visitas.</p>
                   </div>
                </TabsContent>
                <TabsContent value="text" className="mt-4">
                     <div className="grid w-full gap-2">
                        <Textarea
                            id="smart-description"
                            placeholder="Ex: 2 caixas de parafusos, 1 furadeira e 3h de consultoria de instalação."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={5}
                            disabled={loading}
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
            </Tabs>
        </CardContent>
    </Card>
  );
}
