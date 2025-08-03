
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase';
import { collection, addDoc, doc, deleteDoc, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/hooks/use-auth';
import type { Expense } from '@/lib/definitions';
import { PlusCircle, Trash2, FileText, CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const expenseCategories = [
    "Fornecedores",
    "Software e Assinaturas",
    "Marketing e Publicidade",
    "Transporte e Viagens",
    "Salários e Pró-labore",
    "Impostos",
    "Aluguel e Contas",
    "Outros"
];


export default function DespesasPage() {
  const [expenses, setExpenses] = React.useState<Expense[]>([]);
  const [loadingData, setLoadingData] = React.useState(true);
  const [open, setOpen] = React.useState(false);
  const [expenseFormData, setExpenseFormData] = React.useState({
    description: '',
    value: '',
    date: new Date(),
    category: '',
  });
  const { toast } = useToast();
  const { user } = useAuth();

  React.useEffect(() => {
    if (!user) {
      setLoadingData(false);
      return;
    };
    
    setLoadingData(true);
    const q = query(collection(db, "expenses"), where("userId", "==", user.uid), orderBy("date", "desc"));
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const expensesData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Expense[];
        setExpenses(expensesData);
        setLoadingData(false);
    }, (error) => {
        console.error("Error fetching expenses: ", error);
        toast({ variant: 'destructive', title: 'Erro', description: 'Não foi possível carregar as despesas.' });
        setLoadingData(false);
    });

    return () => unsubscribe();
  }, [user, toast]);


  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setExpenseFormData((prev) => ({ ...prev, [id]: value }));
  };
  
  const handleDateChange = (date: Date | undefined) => {
    if (date) {
        setExpenseFormData((prev) => ({ ...prev, date }));
    }
  }

  const handleCategoryChange = (value: string) => {
    setExpenseFormData((prev) => ({ ...prev, category: value }));
  }

  const handleOpenDialog = () => {
    setExpenseFormData({ description: '', value: '', date: new Date(), category: '' });
    setOpen(true);
  }

  const handleSaveExpense = async () => {
    if (!user) {
      toast({ variant: 'destructive', title: 'Acesso Negado', description: 'Você precisa estar logado para criar uma despesa.' });
      return;
    }

    if (expenseFormData.description && expenseFormData.value && expenseFormData.date && expenseFormData.category) {
        const newExpenseData = {
          userId: user.uid,
          description: expenseFormData.description,
          value: parseFloat(expenseFormData.value),
          date: format(expenseFormData.date, 'yyyy-MM-dd'),
          category: expenseFormData.category
        };

        await addDoc(collection(db, "expenses"), newExpenseData);
        toast({
          title: 'Despesa Salva!',
          description: `${expenseFormData.description} foi adicionada à sua lista.`,
        });
        setOpen(false);

    } else {
        toast({ variant: 'destructive', title: 'Campos obrigatórios', description: 'Preencha todos os campos para salvar.' });
    }
  };

  const handleDeleteExpense = async (expenseId: string) => {
    await deleteDoc(doc(db, "expenses", expenseId));
    toast({
        title: 'Despesa Excluída!',
        description: 'A despesa foi removida da sua lista.',
        variant: 'destructive'
    })
  };
  
  const isLoading = loadingData;

  return (
    <div className="flex-1 space-y-4 p-4 pt-6 sm:p-8 animate-in fade-in-0">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight">Controle de Despesas</h1>
         <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button onClick={handleOpenDialog}>
                <PlusCircle className="mr-2 h-4 w-4" /> Nova Despesa
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[480px]">
                <DialogHeader>
                    <DialogTitle>Adicionar Nova Despesa</DialogTitle>
                    <DialogDescription>
                        Preencha as informações da despesa. Clique em salvar para concluir.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="description" className="text-right">Descrição</Label>
                      <Input id="description" value={expenseFormData.description} onChange={handleInputChange} className="col-span-3" />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="value" className="text-right">Valor (R$)</Label>
                      <Input id="value" type="number" value={expenseFormData.value} onChange={handleInputChange} className="col-span-3" />
                  </div>
                   <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="date" className="text-right">Data</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                            <Button
                            variant={"outline"}
                            className={cn(
                                "col-span-3 justify-start text-left font-normal",
                                !expenseFormData.date && "text-muted-foreground"
                            )}
                            >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {expenseFormData.date ? format(expenseFormData.date, "PPP", { locale: ptBR }) : <span>Selecione uma data</span>}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                            <Calendar
                            mode="single"
                            selected={expenseFormData.date}
                            onSelect={handleDateChange}
                            initialFocus
                            />
                        </PopoverContent>
                     </Popover>
                  </div>
                   <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="category" className="text-right">Categoria</Label>
                       <Select onValueChange={handleCategoryChange} value={expenseFormData.category}>
                        <SelectTrigger className="col-span-3">
                            <SelectValue placeholder="Selecione uma categoria" />
                        </SelectTrigger>
                        <SelectContent>
                            {expenseCategories.map(cat => (
                                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                            ))}
                        </SelectContent>
                        </Select>
                  </div>
                </div>
                <DialogFooter>
                <Button type="submit" onClick={handleSaveExpense}>
                    Salvar Despesa
                </Button>
                </DialogFooter>
            </DialogContent>
         </Dialog>
      </div>
      <Card>
        <CardHeader>
            <CardTitle>Histórico de Despesas</CardTitle>
            <CardDescription>
                Visualize e gerencie suas despesas lançadas.
            </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Descrição</TableHead>
                <TableHead className="hidden sm:table-cell">Categoria</TableHead>
                <TableHead className="hidden md:table-cell">Data</TableHead>
                <TableHead className="text-right">Valor</TableHead>
                <TableHead>
                  <span className="sr-only">Ações</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-5 w-40" /></TableCell>
                    <TableCell className="hidden sm:table-cell"><Skeleton className="h-5 w-32" /></TableCell>
                    <TableCell className="hidden md:table-cell"><Skeleton className="h-5 w-24" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-5 w-20 ml-auto" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : expenses.length > 0 ? (
                expenses.map((expense) => (
                    <TableRow key={expense.id}>
                        <TableCell className="font-medium">{expense.description}</TableCell>
                        <TableCell className="hidden sm:table-cell">{expense.category}</TableCell>
                        <TableCell className="hidden md:table-cell">{format(new Date(expense.date), "dd/MM/yyyy")}</TableCell>
                        <TableCell className="text-right">{expense.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</TableCell>
                        <TableCell className="text-right">
                           <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => handleDeleteExpense(expense.id)}
                            >
                                <Trash2 className="h-4 w-4 text-destructive" />
                                <span className="sr-only">Excluir</span>
                            </Button>
                        </TableCell>
                    </TableRow>
                ))
              ) : (
                <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                        <div className="text-center text-muted-foreground py-8">
                            <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                            <p className='mb-2 font-medium'>Nenhuma despesa encontrada.</p>
                            <p className='text-sm'>Adicione uma nova despesa para começar.</p>
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
