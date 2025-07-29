import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Invoice } from "@/lib/definitions";

const invoices: Invoice[] = [
  { id: '1', key: 'NFE35240700000000000111550010000001231000000123', client: 'Empresa A Soluções', date: '2024-07-20', status: 'autorizada', value: '1.500,00' },
  { id: '2', key: 'NFE35240700000000000111550010000004561000000456', client: 'Comércio Varejista B', date: '2024-07-19', status: 'cancelada', value: '750,50' },
  { id: '3', key: 'NFE35240700000000000111550010000007891000000789', client: 'Indústria C Ltda', date: '2024-07-19', status: 'autorizada', value: '12.890,00' },
  { id: '4', key: 'NFE35240700000000000111550010000009871000000987', client: 'Serviços D Online', date: '2024-07-18', status: 'rascunho', value: '345,00' },
  { id: '5', key: 'NFE35240700000000000111550010000006541000000654', client: 'Consultoria E', date: '2024-07-17', status: 'autorizada', value: '5.200,75' },
];

export default function NotasPage() {
  return (
    <div className="flex-1 space-y-4 p-4 sm:p-8 pt-6">
       <div className="flex items-center justify-between space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Notas Fiscais</h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Emissões</CardTitle>
          <CardDescription>
            Visualize e gerencie suas notas fiscais emitidas.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead className="hidden sm:table-cell">Status</TableHead>
                <TableHead className="hidden md:table-cell">Data</TableHead>
                <TableHead className="text-right">Valor</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map((invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell>
                    <div className="font-medium">{invoice.client}</div>
                    <div className="hidden text-sm text-muted-foreground md:inline truncate max-w-xs">
                      Chave: {invoice.key}
                    </div>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <Badge 
                      variant={
                        invoice.status === 'autorizada' ? 'default' : 
                        invoice.status === 'cancelada' ? 'destructive' : 'secondary'
                      }
                    >
                      {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">{invoice.date}</TableCell>
                  <TableCell className="text-right">R$ {invoice.value}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
