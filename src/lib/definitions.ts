

export type InvoiceItem = {
    description: string;
    quantity: number;
    unitPrice: number;
}

export type Invoice = {
  id: string;
  key: string;
  client: string;
  clientId: string | null;
  destinatario: {
    nome: string;
    cpf_cnpj: string;
    endereco?: string;
  }
  date: string;
  status: 'pendente' | 'paga' | 'vencida' | 'cancelada' | 'rascunho';
  value: number;
  userId: string;
  items: InvoiceItem[];
  dueDate?: string;
  naturezaOperacao: string;
};

export type Client = {
  id:string;
  name: string;
  email: string;
  phone: string;
  cpf_cnpj: string;
  userId: string;
  avatarUrl?: string;
};

export type Expense = {
  id: string;
  userId: string;
  description: string;
  value: number;
  date: string;
  category: string;
};

export type ExtractedData = {
    recipient: {
        name: string;
        document: string;
        address: string;
    },
    items: InvoiceItem[]
}

export type ExtractedClientData = ExtractedData;
