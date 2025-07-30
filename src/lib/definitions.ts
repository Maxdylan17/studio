
export type Invoice = {
  id: string;
  key: string;
  client: string;
  clientId: string | null;
  date: string;
  status: 'autorizada' | 'cancelada' | 'rascunho';
  value: string;
  userId: string;
};

export type Client = {
  id: string;
  name: string;
  email: string;
  phone: string;
  cpf_cnpj: string;
  userId: string;
  avatarUrl?: string;
};
