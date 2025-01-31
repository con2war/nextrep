import { handleAuth } from '@auth0/nextjs-auth0/edge'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

const handler = handleAuth()

export const GET = handler
export const POST = handler 