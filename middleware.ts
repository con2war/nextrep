import { withMiddlewareAuthRequired } from '@auth0/nextjs-auth0/edge'

export default withMiddlewareAuthRequired()

export const config = {
  matcher: [
    '/daily-workout',
    '/custom-workout',
    '/profile',
    '/stats',
    '/api/user/:path*',
    '/api/workouts/:path*',
    '/api/generate-workout',
    '/((?!api/auth/auth|_next/static|_next/image|favicon.ico).*)'
  ]
} 