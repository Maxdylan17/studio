
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

const COMPANY_PROFILE_KEY = 'fiscalflow:companyProfile';
const CERTIFICATE_INFO_KEY = 'fiscalflow:certificateInfo';

export default function ConfiguracoesPage() {
  const { toast } = useToast();
  const [companyName, setCompanyName] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [certificateFile, setCertificateFile] = useState<File | null>(null);
  const [certificatePassword, setCertificatePassword] = useState('');

  useEffect(() => {
    const savedProfile = localStorage.getItem(COMPANY_PROFILE_KEY);
    if (savedProfile) {
      const { companyName, cnpj } = JSON.parse(savedProfile);
      setCompanyName(companyName || 'FiscalFlow Soluções');
      setCnpj(cnpj || '00.000.000/0001-00');
    } else {
        setCompanyName('FiscalFlow Soluções');
        setCnpj('00.000.000/0001-00');
    }

    const savedCertInfo = localStorage.getItem(CERTIFICATE_INFO_KEY);
    if (savedCertInfo) {
      const { password } = JSON.parse(savedCertInfo);
      setCertificatePassword(password || '');
    }
  }, []);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      setCertificateFile(event.target.files[0]);
    }
  };
  
  const handleSaveChanges = () => {
    const companyProfile = { companyName, cnpj };
    localStorage.setItem(COMPANY_PROFILE_KEY, JSON.stringify(companyProfile));

    const certificateInfo = { password: certificatePassword };
    localStorage.setItem(CERTIFICATE_INFO_KEY, JSON.stringify(certificateInfo));
    
    toast({
        title: "Configurações Salvas!",
        description: "As informações da sua empresa foram atualizadas."
    })
  }

  return (
    <div className="flex-1 space-y-4 p-4 pt-6 sm:p-8">
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
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="cnpj">CNPJ</Label>
              <Input
                id="cnpj"
                value={cnpj}
                onChange={(e) => setCnpj(e.target.value)}
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
              <Input id="certificate" type="file" onChange={handleFileChange} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Senha do Certificado</Label>
              <Input
                id="password"
                type="password"
                value={certificatePassword}
                onChange={(e) => setCertificatePassword(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>
         <div className="flex justify-end">
          <Button onClick={handleSaveChanges}>
            <Save className="mr-2 h-4 w-4" />
            Salvar Alterações
          </Button>
        </div>
      </div>
    </div>
  );
}
