
'use client';

import { useState } from 'react';
import { UseFormReturn, UseFieldArrayReturn } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Wand2, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { handleSmartIssuance } from '@/lib/actions';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/card';

interface SmartIssuanceProps {
  form: UseFormReturn<any>;
  replace: UseFieldArrayReturn<any, "items", "id">['replace'];
}

export function SmartIssuance({ form, replace }: SmartIssuanceProps) {
  const [loading, setLoading] = useState(false);
  const [description, setDescription] = useState('');
  const { toast } = useToast();

  const handleGenerateItems = async () => {
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
        // A função 'replace' do useFieldArray substitui todos os itens existentes
        replace(result.items);
        toast({
          title: 'Itens Gerados com Sucesso!',
          description: 'A lista de itens foi preenchida pela IA.',
        });
      } else {
         toast({
          variant: 'destructive',
          title: 'Nenhum item gerado',
          description: 'A IA não conseguiu identificar itens na descrição fornecida. Tente ser mais específico.',
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
     <Card className="bg-secondary/50 border-dashed">
        <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-base">
                <Wand2 className="h-5 w-5 text-primary" />
                Emissão Inteligente (Opcional)
            </CardTitle>
            <CardDescription className="text-sm">
            Descreva os produtos ou serviços e deixe a IA preencher os itens e valores para você.
            </CardDescription>
        </CardHeader>
        <CardContent>
            <div className="grid w-full gap-2">
                <Textarea
                    id="smart-description"
                    placeholder="Ex: Criação de um website institucional com 3 páginas, design responsivo, e um ano de hospedagem."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                />
                 <Button onClick={handleGenerateItems} disabled={loading} className="w-full sm:w-auto ml-auto">
                    {loading ? (
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                        <Wand2 className="mr-2 h-4 w-4" />
                    )}
                    {loading ? 'Gerando Itens...' : 'Gerar Itens com IA'}
                </Button>
            </div>
        </CardContent>
    </Card>
  );
}
