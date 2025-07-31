
'use client';

import * as React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, PlusCircle, Repeat, FileText, Play, Pause, Trash2, Edit } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase';
import { collection, doc, deleteDoc, updateDoc, query, where, onSnapshot, orderBy, addDoc } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import type { Recurrence } from '@/lib/definitions';
import { useAuth } from '@/hooks/use-auth';
import { RecurrenceForm } from '@/components/recorrencias/recurrence-form';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { add, formatISO, isAfter } from 'date-fns';

const statusConfig: { [key in Recurrence['status']]: { variant: "default" | "secondary" | "destructive" | "success" | "warning"; text: string } } = {
  active: { variant: 'success', text: 'Ativa' },
  paused: { variant: 'warning', text: 'Pausada' },
  completed: { variant: 'secondary', text: 'Concluída' },
};


export default function RecorrenciasPage() {
  const [recurrences, setRecurrences] = React.useState<Recurrence[]>([]);
  const [loadingData, setLoadingData] = React.useState(true);
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [selectedRecurrence, setSelectedRecurrence] = React.useState<Recurrence | null>(null);
  const [loadingAction, setLoadingAction] = React.useState(false);
  
  const { toast } = useToast();
  const { user } = useAuth();

  React.useEffect(() => {
    if (!user) {
      setLoadingData(false);
      return;
    };
    
    setLoadingData(true);
    const q = query(collection(db, "recurrences"), where("userId", "==", user.uid), orderBy("startDate", "asc"));
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const recurrencesData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Recurrence[];
        setRecurrences(recurrencesData.reverse());
        setLoadingData(false);
    }, (error) => {
        console.error("Error fetching recurrences: ", error);
        toast({ variant: 'destructive', title: 'Erro', description: 'Não foi possível carregar as recorrências.' });
        setLoadingData(false);
    });

    return () => unsubscribe();
  }, [user, toast]);

  const handleOpenForm = (recurrence?: Recurrence) => {
    setSelectedRecurrence(recurrence || null);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setSelectedRecurrence(null);
    setIsFormOpen(false);
  };
  
  const handleDelete = async (id: string) => {
      await deleteDoc(doc(db, "recurrences", id));
      toast({ title: 'Recorrência Excluída', description: 'A recorrência foi removida com sucesso.', variant: 'destructive'});
  }

  const handleToggleStatus = async (id: string, currentStatus: Recurrence['status']) => {
      const newStatus = currentStatus === 'active' ? 'paused' : 'active';
      await updateDoc(doc(db, "recurrences", id), { status: newStatus });
      toast({ title: 'Status Alterado', description: `A recorrência foi ${newStatus === 'active' ? 'ativada' : 'pausada'}.`});
  }

  const handleRunRecurrences = async () => {
    setLoadingAction(true);
    let generatedCount = 0;
    const now = new Date();

    for (const recurrence of recurrences) {
        if (recurrence.status !== 'active') continue;

        let nextGenerationDate;
        if (recurrence.lastGeneratedDate) {
            nextGenerationDate = add(new Date(recurrence.lastGeneratedDate), {
                [recurrence.frequency.replace('ly', 's')]: recurrence.interval,
            });
        } else {
            nextGenerationDate = new Date(recurrence.startDate);
        }

        if (isAfter(now, nextGenerationDate)) {
             try {
                const newInvoice = {
                    key: `NFE352407${Math.floor(1000000000000000 + Math.random() * 9000000000000000)}`,
                    client: recurrence.clientName,
                    clientId: recurrence.clientId,
                    date: formatISO(now, { representation: 'date' }),
                    status: 'pendente',
                    value: recurrence.totalValue.toFixed(2).replace('.',','),
                    userId: user!.uid,
                    items: recurrence.items,
                    recurrenceId: recurrence.id
                };
                await addDoc(collection(db, "invoices"), newInvoice);
                await updateDoc(doc(db, "recurrences", recurrence.id), { lastGeneratedDate: formatISO(now, { representation: 'date' }) });
                generatedCount++;
             } catch(e) {
                 console.error("Failed to generate invoice for recurrence", recurrence.id, e);
                 toast({ variant: 'destructive', title: `Erro ao gerar nota para ${recurrence.clientName}`});
             }
        }
    }
    
    if (generatedCount > 0) {
        toast({ title: "Recorrências Executadas", description: `${generatedCount} nota(s) fiscal(is) foram geradas com sucesso.` });
    } else {
        toast({ title: "Nenhuma recorrência pendente", description: "Todas as faturas recorrentes estão em dia." });
    }

    setLoadingAction(false);
  }

  if (isFormOpen) {
    return <RecurrenceForm recurrence={selectedRecurrence} onCancel={handleCloseForm} />;
  }

  return (
    <div className="flex-1 space-y-4 p-4 pt-6 sm:p-8 animate-in fade-in-0">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight">Faturas Recorrentes</h1>
        <div className="flex items-center gap-2">
            <Button onClick={handleRunRecurrences} variant="outline" disabled={loadingAction}>
                {loadingAction ? 'Gerando...' : 'Gerar Faturas Pendentes'}
            </Button>
            <Button onClick={() => handleOpenForm()}>
                <PlusCircle className="mr-2 h-4 w-4" /> Nova Recorrência
            </Button>
        </div>
      </div>
      <Card>
        <CardHeader>
            <CardTitle>Lista de Recorrências</CardTitle>
            <CardDescription>
                Gerencie suas faturas recorrentes. O sistema irá gerar as notas automaticamente.
            </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead className="hidden sm:table-cell">Status</TableHead>
                <TableHead className="hidden md:table-cell">Próxima Execução</TableHead>
                <TableHead className="text-right">Valor</TableHead>
                <TableHead>
                  <span className="sr-only">Ações</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loadingData ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-5 w-36" /></TableCell>
                    <TableCell className="hidden sm:table-cell"><Skeleton className="h-6 w-24" /></TableCell>
                    <TableCell className="hidden md:table-cell"><Skeleton className="h-5 w-28" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-5 w-20 ml-auto" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : recurrences.length > 0 ? (
                recurrences.map((item) => {
                    let nextDate = 'N/A';
                    if (item.status === 'active') {
                        const baseDate = item.lastGeneratedDate ? new Date(item.lastGeneratedDate) : new Date(item.startDate);
                        nextDate = formatISO(add(baseDate, { [item.frequency.replace('ly', 's')]: item.interval }), { representation: 'date' });
                    }
                   
                    return (
                    <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.clientName}</TableCell>
                        <TableCell className="hidden sm:table-cell">
                            <Badge variant={statusConfig[item.status].variant}>
                                {statusConfig[item.status].text}
                            </Badge>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">{nextDate}</TableCell>
                        <TableCell className="text-right">R$ {item.totalValue.toFixed(2)}</TableCell>
                        <TableCell className="text-right">
                            <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                aria-haspopup="true"
                                size="icon"
                                variant="ghost"
                                >
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">Toggle menu</span>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Ações</DropdownMenuLabel>
                                <DropdownMenuItem onClick={() => handleOpenForm(item)}>
                                    <Edit className="mr-2 h-4 w-4" /> Editar
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleToggleStatus(item.id, item.status)}>
                                    {item.status === 'active' ? <Pause className="mr-2 h-4 w-4" /> : <Play className="mr-2 h-4 w-4" />}
                                    {item.status === 'active' ? 'Pausar' : 'Ativar'}
                                </DropdownMenuItem>
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive focus:bg-destructive/10 focus:text-destructive">
                                        <Trash2 className="mr-2 h-4 w-4" /> Excluir
                                    </DropdownMenuItem>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Esta ação não pode ser desfeita. Isso excluirá permanentemente a recorrência. As notas já geradas não serão afetadas.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                      <AlertDialogAction onClick={() => handleDelete(item.id)}>Confirmar</AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                            </DropdownMenuContent>
                            </DropdownMenu>
                        </TableCell>
                    </TableRow>
                )})
              ) : (
                <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                        <div className="text-center text-muted-foreground py-8">
                            <Repeat className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                            <p className='mb-2 font-medium'>Nenhuma recorrência encontrada.</p>
                            <p className='text-sm'>Crie sua primeira fatura recorrente para automatizar cobranças.</p>
                        </div>
                    </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

    

    