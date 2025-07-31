
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
  date: string;
  status: 'pendente' | 'paga' | 'vencida' | 'cancelada' | 'rascunho';
  value: string;
  userId: string;
  items: InvoiceItem[];
  dueDate?: string;
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

export type ExtractedData = {
    recipient: {
        name?: string;
        document?: string;
        address?: string;
    },
    items: InvoiceItem[]
}

export type ExtractedClientData = {
    [key: string]: string | undefined;
    nome?: string;
    cpf?: string;
    rg?: string;
    cnh?: string;
    data_nascimento?: string;
    filiacao?: string;
}
