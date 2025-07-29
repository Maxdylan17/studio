import { redirect } from 'next/navigation';

// A raiz do site redireciona para a página de login por padrão.
export default function RootPage() {
  redirect('/login');
}
