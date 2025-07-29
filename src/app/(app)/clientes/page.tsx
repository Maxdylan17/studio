import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";

export default function ClientesPage() {
  return (
    <div className="flex-1 space-y-4 p-4 sm:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Clientes</h1>
        <Button>
            <PlusCircle className="mr-2 h-4 w-4" /> Novo Cliente
        </Button>
      </div>
      <Card>
        <CardHeader>
            <CardTitle>Lista de Clientes</CardTitle>
        </CardHeader>
        <CardContent>
            <div className="text-center text-muted-foreground py-12">
                <p>Nenhum cliente cadastrado ainda.</p>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
