
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

const GithubIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" {...props}>
        <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/>
    </svg>
)

export default function ConfiguracoesPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [companyName, setCompanyName] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [aliquota, setAliquota] = useState('');
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
          setAliquota(settings.aliquota || '4.5');
          setCertificatePassword(settings.certificatePassword || '');
        } else {
          // Set default values if no settings found
          setCompanyName('FiscalFlow Soluções');
          setCnpj('00.000.000/0001-00');
          setAliquota('4.5');
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
      aliquota,
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

  const handleConnectGitHub = () => {
    // This is the first step of the OAuth flow.
    // The client_id would be your GitHub App's client ID.
    // The redirect_uri is where GitHub sends the user back after authorization.
    const githubClientId = 'YOUR_GITHUB_CLIENT_ID'; // Placeholder
    const redirectUri = `${window.location.origin}/api/auth/github/callback`;
    const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${githubClientId}&redirect_uri=${redirectUri}&scope=repo`;
    
    toast({
        title: "Redirecionando para o GitHub...",
        description: "Você precisa autorizar o acesso para continuar. Lembre-se que esta é uma demonstração e a conexão não será completada."
    });

    // In a real app, you would redirect the user.
    setTimeout(() => {
        // window.location.href = githubAuthUrl;
        console.log("A implementação completa requer um Client ID do GitHub e um endpoint de backend.");
        console.log("Redirecionaria para:", githubAuthUrl);
    }, 2000);
  }

  return (
    <div className="flex-1 space-y-4 p-4 pt-6 sm:p-8 animate-in fade-in-0">
      <div className="flex items-center justify-between space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Configurações</h1>
      </div>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Perfil da Empresa e Impostos</CardTitle>
            <CardDescription>
              Gerencie as informações da sua empresa e a alíquota de impostos para os relatórios.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
            </div>
             <div className="grid gap-2 max-w-xs">
                <Label htmlFor="aliquota">Alíquota do Simples Nacional (%)</Label>
                <Input
                    id="aliquota"
                    type="number"
                    value={aliquota}
                    onChange={(e) => setAliquota(e.target.value)}
                    disabled={loading}
                    placeholder="Ex: 4.5"
                />
                <p className="text-xs text-muted-foreground">
                    Essa alíquota será usada para calcular a estimativa de imposto na página de Relatórios.
                </p>
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
         <Card>
            <CardHeader>
                <CardTitle>Integrações</CardTitle>
                <CardDescription>
                    Conecte sua conta a outros serviços para automatizar tarefas e salvar seu código.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Button variant="outline" onClick={handleConnectGitHub}>
                    <GithubIcon className="mr-2 h-4 w-4" />
                    Conectar com GitHub
                </Button>
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
