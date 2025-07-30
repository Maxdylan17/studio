
'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Save } from 'lucide-react';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { useAuth } from '@/hooks/use-auth';

export default function ConfiguracoesPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [companyName, setCompanyName] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [certificateFile, setCertificateFile] = useState<File | null>(null);
  const [certificatePassword, setCertificatePassword] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSettings = async () => {
        if (!user) return;
        setLoading(true);
        const docRef = doc(db, "settings", user.uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const settings = docSnap.data();
          setCompanyName(settings.companyName || 'FiscalFlow Soluções');
          setCnpj(settings.cnpj || '00.000.000/0001-00');
          setCertificatePassword(settings.certificatePassword || '');
        } else {
          // Set default values if no settings found
          setCompanyName('FiscalFlow Soluções');
          setCnpj('00.000.000/0001-00');
        }
        setLoading(false);
    };
    loadSettings();
  }, [user]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      setCertificateFile(event.target.files[0]);
    }
  };
  
  const handleSaveChanges = async () => {
    if (!user) {
        toast({ variant: 'destructive', title: 'Acesso Negado', description: 'Você precisa estar logado para salvar.'});
        return;
    }
    const settingsData = {
      companyName,
      cnpj,
      certificatePassword
    };

    try {
      await setDoc(doc(db, "settings", user.uid), settingsData, { merge: true });
      toast({
          title: "Configurações Salvas!",
          description: "As informações da sua empresa foram atualizadas."
      });
    } catch (error) {
       console.error("Error saving settings: ", error);
       toast({
          variant: "destructive",
          title: "Erro ao salvar",
          description: "Não foi possível salvar as configurações. Tente novamente."
      });
    }
  }

  return (
    <div className="flex-1 space-y-4 p-4 pt-6 sm:p-8 animate-in fade-in-0">
      <div className="flex items-center justify-between space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Configurações</h1>
      </div>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Perfil da Empresa</CardTitle>
            <CardDescription>
              Gerencie as informações da sua empresa.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="company-name">Nome da Empresa</Label>
              <Input
                id="company-name"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                disabled={loading}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="cnpj">CNPJ</Label>
              <Input
                id="cnpj"
                value={cnpj}
                onChange={(e) => setCnpj(e.target.value)}
                disabled={loading}
              />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Certificado Digital</CardTitle>
            <CardDescription>
              Faça o upload e gerencie seu certificado A1 para emissão de notas.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="certificate">Arquivo do Certificado (.pfx)</Label>
              <Input id="certificate" type="file" onChange={handleFileChange} disabled={loading} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Senha do Certificado</Label>
              <Input
                id="password"
                type="password"
                value={certificatePassword}
                onChange={(e) => setCertificatePassword(e.target.value)}
                disabled={loading}
              />
            </div>
          </CardContent>
        </Card>
         <div className="flex justify-end">
          <Button onClick={handleSaveChanges} disabled={loading}>
            <Save className="mr-2 h-4 w-4" />
            Salvar Alterações
          </Button>
        </div>
      </div>
    </div>
  );
}
