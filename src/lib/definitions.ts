
export type Invoice = {
  id: string;
  key: string;
  client: string;
  date: string;
  status: 'autorizada' | 'cancelada' | 'rascunho';
  value: string;
};
