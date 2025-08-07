
'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Wand2, RefreshCw, Camera, Upload, Video, Image as ImageIcon, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { handleSmartIssuance } from '@/lib/actions';
import { handleProcessDocument } from '@/lib/actions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import type { ExtractedData } from '@/lib/definitions';

interface AiIssuanceProps {
  onExtractionComplete: (data: ExtractedData) => void;
}

export function AiIssuance({ onExtractionComplete }: AiIssuanceProps) {
  const [loading, setLoading] = useState(false);
  const [description, setDescription] = useState('');
  const [activeTab, setActiveTab] = useState("camera");
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [file, setFile] = useState<File | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const { toast } = useToast();

  const cleanupCamera = useCallback(() => {
    if (videoRef.current?.srcObject) {
     const stream = videoRef.current.srcObject as MediaStream;
     stream.getTracks().forEach(track => track.stop());
     videoRef.current.srcObject = null;
   }
  }, []);

  useEffect(() => {
    if (activeTab === 'camera') {
      const getCameraPermission = async () => {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true });
          setHasCameraPermission(true);
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        } catch (error) {
          console.error('Error accessing camera:', error);
          setHasCameraPermission(false);
          toast({
            variant: 'destructive',
            title: 'Acesso à Câmera Negado',
            description: 'Por favor, habilite a permissão da câmera nas configurações do seu navegador.',
          });
        }
      };
      getCameraPermission();
    } else {
      cleanupCamera();
    }

    return () => {
      cleanupCamera();
    };
  }, [activeTab, toast, cleanupCamera]);

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

  const handleCaptureAndExtract = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUri = canvas.toDataURL('image/png');
        processDataUri(dataUri);
      } else {
        toast({ variant: 'destructive', title: 'Erro', description: 'Não foi possível capturar a imagem.'});
      }
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
                Use a IA para preencher os dados da nota automaticamente. Comece usando sua câmera ou descrevendo os serviços.
            </CardDescription>
        </CardHeader>
        <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="camera"><Video className="mr-2 h-4 w-4" /> Câmera / Imagem</TabsTrigger>
                    <TabsTrigger value="text"><Wand2 className="mr-2 h-4 w-4"/> Texto</TabsTrigger>
                </TabsList>
                <TabsContent value="camera" className="mt-4">
                   <div className="space-y-4">
                        <div className="relative aspect-video w-full bg-muted rounded-md overflow-hidden flex items-center justify-center">
                            <video ref={videoRef} className="w-full h-full object-cover" autoPlay muted playsInline />
                            <canvas ref={canvasRef} className="hidden" />
                            {hasCameraPermission === false && (
                                <div className="p-4 text-center">
                                    <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground" />
                                    <p className="mt-2 text-sm text-muted-foreground">A permissão da câmera foi negada.</p>
                                </div>
                            )}
                             {hasCameraPermission === null && !loading && (
                                <div className="p-4 text-center">
                                    <p className="mt-2 text-sm text-muted-foreground">Aguardando permissão da câmera...</p>
                                </div>
                            )}
                            {loading && (
                                <div className="absolute inset-0 bg-background/80 flex flex-col items-center justify-center gap-2">
                                    <RefreshCw className="h-8 w-8 animate-spin text-primary" />
                                    <p className="text-muted-foreground">Analisando imagem...</p>
                                </div>
                            )}
                        </div>
                        {hasCameraPermission === false && (
                            <Alert variant="destructive">
                                <AlertTitle>Acesso à Câmera Necessário</AlertTitle>
                                <AlertDescription>
                                    Habilite a permissão nas configurações do seu navegador para usar a câmera.
                                </AlertDescription>
                            </Alert>
                        )}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                             <Button onClick={handleCaptureAndExtract} disabled={loading || !hasCameraPermission} size="lg">
                                <Camera className="mr-2 h-4 w-4" />
                                Tirar Foto e Extrair
                            </Button>
                             <Button asChild size="lg" variant="outline">
                                <label>
                                    <Upload className="mr-2 h-4 w-4" />
                                    Carregar Imagem
                                    <input type="file" accept="image/*" className="sr-only" onChange={(e) => e.target.files && setFile(e.target.files[0])} />
                                </label>
                            </Button>
                        </div>
                        {file && (
                             <div className="text-center">
                                 <p className="text-sm text-muted-foreground mb-2">Arquivo selecionado: {file.name}</p>
                                 <Button onClick={handleFileAndExtract} disabled={loading}>
                                    <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                                     Processar Arquivo
                                 </Button>
                            </div>
                        )}
                   </div>
                </TabsContent>
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
            </Tabs>
        </CardContent>
    </Card>
  );
}
