import { handleAuth } from '@auth0/nextjs-auth0'

export const dynamic = 'force-dynamic'

const handler = handleAuth({
  onError(req: Request, error: Error & { status?: number }) {
    console.error('Auth error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: error.status || 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
})

export const GET = handler
export const POST = handler 