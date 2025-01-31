import { handleAuth } from '@auth0/nextjs-auth0/edge'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

export const GET = handleAuth()
export const POST = handleAuth() 