
'use client';

import { useState } from 'react';
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
import { Camera, RefreshCw } from 'lucide-react';
import { handleSmartDataCapture } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';

interface DataCaptureProps {
  form: UseFormReturn<any>;
}

export function DataCapture({ form }: DataCaptureProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [documentType, setDocumentType] = useState('CNH');
  const [file, setFile] = useState<File | null>(null);
  const { toast } = useToast();

  const onFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setFile(event.target.files[0]);
    }
  };

  const onExtract = async () => {
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
    reader.onload = async () => {
      const dataUri = reader.result as string;
      try {
        const result = await handleSmartDataCapture({ documentDataUri: dataUri, documentType });
        const { extractedData } = result;
        
        // Mapeia os campos extraídos para os campos do formulário
        // A IA pode retornar diferentes nomes de campos, então tratamos os mais comuns.
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
          description: 'Não foi possível extrair os dados do documento. Verifique o console para mais detalhes.',
        });
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
     reader.onerror = (error) => {
        setLoading(false);
        toast({
            variant: 'destructive',
            title: 'Erro ao ler arquivo',
            description: 'Não foi possível ler o arquivo de imagem.',
        });
        console.error(error);
    };
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Camera className="mr-2 h-4 w-4" />
          Capturar Dados do Documento
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Captura Inteligente de Dados</DialogTitle>
          <DialogDescription>
            Faça o upload de um documento (RG, CNH) para preencher os dados do destinatário automaticamente.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid w-full max-w-sm items-center gap-1.5">
            <Label htmlFor="picture">Documento</Label>
            <Input id="picture" type="file" accept="image/*" onChange={onFileChange} />
          </div>
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
        </div>
        <DialogFooter>
          <Button onClick={onExtract} disabled={loading || !file}>
            {loading ? (
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            {loading ? 'Extraindo...' : 'Extrair Dados'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
