import { getSession } from '@auth0/nextjs-auth0'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ isAuthenticated: false }, { status: 401 })
    }
    return NextResponse.json({ isAuthenticated: true, user: session.user })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
} 