
'use client';

import { useState, useRef, useEffect } from 'react';
import { UseFormReturn } from 'react-hook-form';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Camera, RefreshCw, Upload, Video, Image as ImageIcon } from 'lucide-react';
import { handleSmartDataCapture } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';

interface DataCaptureProps {
  form: UseFormReturn<any>;
}

export function DataCapture({ form }: DataCaptureProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [documentType, setDocumentType] = useState('CNH');
  const [file, setFile] = useState<File | null>(null);
  const [activeTab, setActiveTab] = useState("camera");
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { toast } = useToast();

  useEffect(() => {
    const cleanupCamera = () => {
       if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
        videoRef.current.srcObject = null;
      }
    };

    if (open && activeTab === 'camera') {
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
  }, [open, activeTab, toast]);


  const onFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      setFile(event.target.files[0]);
    }
  };
  
  const processDataUri = async (dataUri: string) => {
     try {
        const result = await handleSmartDataCapture({ documentDataUri: dataUri, documentType });
        const { extractedData } = result;
        
        const name = extractedData.nome || extractedData.name || extractedData.NOME;
        const documentNumber = extractedData.cpf || extractedData.cpf_cnpj || extractedData.CPF || 
                               extractedData.cnh || extractedData.CNH || 
                               extractedData.rg || extractedData.RG;

        if (name) {
          form.setValue('destinatario.nome', name, { shouldValidate: true });
        }
        if (documentNumber) {
          form.setValue('destinatario.cpf_cnpj', documentNumber, { shouldValidate: true });
        }

        if(!name && !documentNumber) {
            toast({
              variant: 'destructive',
              title: 'Dados não encontrados',
              description: 'Não foi possível extrair nome ou documento da imagem. Tente uma imagem mais nítida.',
            });
        } else {
            toast({
              title: 'Dados Extraídos com Sucesso!',
              description: 'Os campos do formulário foram preenchidos.',
            });
            setOpen(false);
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
      setLoading(true);
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
        setLoading(false);
        toast({ variant: 'destructive', title: 'Erro', description: 'Não foi possível capturar a imagem.'});
      }
    }
  };

  const handleFileAndExtract = () => {
    if (!file) {
      toast({
        variant: 'destructive',
        title: 'Nenhum arquivo selecionado',
        description: 'Por favor, selecione um arquivo de imagem.',
      });
      return;
    }
    
    setLoading(true);
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const dataUri = reader.result as string;
      processDataUri(dataUri);
    };
    reader.onerror = (error) => {
        setLoading(false);
        toast({ variant: 'destructive', title: 'Erro ao ler arquivo', description: 'Não foi possível ler o arquivo de imagem.' });
        console.error(error);
    };
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Camera className="mr-2 h-4 w-4" />
          Capturar Dados do Documento
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Captura Inteligente de Dados</DialogTitle>
          <DialogDescription>
            Use a câmera ou faça o upload de um documento (RG, CNH) para preencher os dados.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
            <div className="grid w-full max-w-sm items-center gap-1.5">
                <Label htmlFor="doc-type">Tipo de Documento</Label>
                <Select value={documentType} onValueChange={setDocumentType}>
                <SelectTrigger id="doc-type">
                    <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="CNH">CNH</SelectItem>
                    <SelectItem value="RG">RG</SelectItem>
                    <SelectItem value="Outro">Outro</SelectItem>
                </SelectContent>
                </Select>
            </div>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="camera"><Video className="mr-2 h-4 w-4" /> Câmera</TabsTrigger>
                    <TabsTrigger value="upload"><Upload className="mr-2 h-4 w-4"/> Upload</TabsTrigger>
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
                             {hasCameraPermission === null && (
                                <div className="p-4 text-center">
                                    <p className="mt-2 text-sm text-muted-foreground">Aguardando permissão da câmera...</p>
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
                   </div>
                </TabsContent>
                <TabsContent value="upload" className="mt-4">
                     <div className="grid w-full items-center gap-1.5">
                        <Label htmlFor="picture">Arquivo de Imagem</Label>
                        <Input id="picture" type="file" accept="image/*" onChange={onFileChange} ref={fileInputRef}/>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
        <DialogFooter>
          {activeTab === 'camera' ? (
             <Button onClick={handleCaptureAndExtract} disabled={loading || !hasCameraPermission} className="w-full">
                {loading ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <Camera className="mr-2 h-4 w-4" />}
                {loading ? 'Extraindo...' : 'Tirar Foto e Extrair'}
            </Button>
          ) : (
            <Button onClick={handleFileAndExtract} disabled={loading || !file} className="w-full">
                {loading ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                {loading ? 'Extraindo...' : 'Fazer Upload e Extrair'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
