
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileDown } from "lucide-react";

export default function RelatoriosPage() {
  return (
    <div className="flex-1 space-y-4 p-4 sm:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Relatórios</h1>
         <Button>
            <FileDown className="mr-2 h-4 w-4" /> Gerar Relatório
        </Button>
      </div>
      <Card>
        <CardHeader>
            <CardTitle>Relatórios Fiscais</CardTitle>
        </CardHeader>
        <CardContent>
            <div className="text-center text-muted-foreground py-12">
                <p>Nenhum relatório gerado ainda.</p>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
