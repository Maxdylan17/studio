import { redirect } from 'next/navigation';

// A raiz do site redireciona para a página de dashboard por padrão.
export default function RootPage() {
  redirect('/dashboard');
}
