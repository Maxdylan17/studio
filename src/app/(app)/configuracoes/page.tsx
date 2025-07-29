import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ConfiguracoesPage() {
  return (
    <div className="flex-1 space-y-4 p-4 sm:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Configurações</h1>
      </div>
       <Card>
        <CardHeader>
            <CardTitle>Perfil da Empresa</CardTitle>
            <CardDescription>Gerencie as informações da sua empresa.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            <div className="grid gap-2">
                <Label htmlFor="company-name">Nome da Empresa</Label>
                <Input id="company-name" placeholder="Sua Empresa LTDA" />
            </div>
            <div className="grid gap-2">
                <Label htmlFor="cnpj">CNPJ</Label>
                <Input id="cnpj" placeholder="00.000.000/0001-00" />
            </div>
        </CardContent>
       </Card>
       <Card>
        <CardHeader>
            <CardTitle>Certificado Digital</CardTitle>
            <CardDescription>Faça o upload e gerencie seu certificado A1.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
             <div className="grid gap-2">
                <Label htmlFor="certificate">Arquivo do Certificado (.pfx)</Label>
                <Input id="certificate" type="file" />
            </div>
             <div className="grid gap-2">
                <Label htmlFor="password">Senha do Certificado</Label>
                <Input id="password" type="password" />
            </div>
        </CardContent>
       </Card>
    </div>
  );
}
