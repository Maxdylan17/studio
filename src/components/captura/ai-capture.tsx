
'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { handleSmartDataCapture } from '@/lib/actions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import type { ExtractedClientData } from '@/lib/definitions';
import { RefreshCw, Camera, Upload, Video, Image as ImageIcon, Sparkles, ScanSearch } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

interface AiCaptureProps {
  onExtractionComplete: (data: ExtractedClientData) => void;
}

export function AiCapture({ onExtractionComplete }: AiCaptureProps) {
  const [loading, setLoading] = useState(false);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState('CNH');
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { toast } = useToast();

  const cleanupCamera = useCallback(() => {
    if (videoRef.current?.srcObject) {
     const stream = videoRef.current.srcObject as MediaStream;
     stream.getTracks().forEach(track => track.stop());
     videoRef.current.srcObject = null;
   }
  }, []);
  
  const getCameraPermission = useCallback(async () => {
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
  }, [toast]);


  useEffect(() => {
    getCameraPermission();
    return () => {
      cleanupCamera();
    };
  }, [getCameraPermission, cleanupCamera]);

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

  return (
    <Card>
        <CardHeader>
            <CardTitle className="flex items-center gap-2">
                <ScanSearch className="h-6 w-6 text-primary" />
                Extrair Dados de Documento
            </CardTitle>
            <CardDescription>
                Tire uma foto ou envie um documento de identificação para cadastrar um novo cliente automaticamente.
            </CardDescription>
        </CardHeader>
        <CardContent>
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
                            <p className="text-muted-foreground">Analisando documento...</p>
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
                 <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
                    <Button onClick={handleCaptureAndExtract} disabled={loading || !hasCameraPermission} className="sm:col-span-1" size="lg">
                        <Camera className="mr-2 h-4 w-4" />
                        Capturar e Extrair
                    </Button>
                    <Button asChild size="lg" variant="outline" className="sm:col-span-1">
                        <label>
                            <Upload className="mr-2 h-4 w-4" />
                            Enviar Documento
                            <input type="file" accept="image/*,application/pdf" className="sr-only" ref={fileInputRef} onChange={handleFileChange} />
                        </label>
                    </Button>
                </div>
            </div>
        </CardContent>
    </Card>
  );
}
