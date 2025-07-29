import { redirect } from 'next/navigation';

export default function AppRootPage() {
  // A raiz do app autenticado redireciona para o dashboard.
  redirect('/dashboard');
}
