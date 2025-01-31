import { handleAuth } from '@auth0/nextjs-auth0'

export const dynamic = 'force-dynamic'

export const GET = handleAuth().logout 