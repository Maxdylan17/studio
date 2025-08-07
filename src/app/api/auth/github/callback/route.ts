
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Esta é a rota de callback para a qual o GitHub redireciona após o usuário autorizar o aplicativo.
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');

  if (!code) {
    // Se nenhum código estiver presente, o usuário pode ter negado a autorização.
    // Redireciona de volta para a página de configurações com um erro.
    return NextResponse.redirect(new URL('/configuracoes?error=github_auth_denied', request.url));
  }

  // Em uma aplicação real, você agora trocaria este 'code' por um token de acesso.
  // Isso requer o Client ID e o Client Secret do seu App GitHub.
  // IMPORTANTE: O Client Secret NUNCA deve ser exposto no lado do cliente.
  // É por isso que esta lógica deve ser executada no servidor (em uma rota de API).

  try {
    // const response = await fetch('https://github.com/login/oauth/access_token', {
    //   method: 'POST',
    //   headers: {
    //     'Content-Type': 'application/json',
    //     'Accept': 'application/json',
    //   },
    //   body: JSON.stringify({
    //     client_id: process.env.GITHUB_CLIENT_ID, 
    //     client_secret: process.env.GITHUB_CLIENT_SECRET,
    //     code: code,
    //   }),
    // });

    // const data = await response.json();

    // if (data.error) {
    //   throw new Error(data.error_description);
    // }

    // const accessToken = data.access_token;
    
    // TODO: Salve o accessToken no banco de dados do usuário de forma segura.

    // Redireciona de volta para a página de configurações com sucesso.
    return NextResponse.redirect(new URL('/configuracoes?success=github_connected', request.url));

  } catch (error) {
    console.error('GitHub OAuth Error:', error);
    return NextResponse.redirect(new URL('/configuracoes?error=github_token_exchange_failed', request.url));
  }
}
