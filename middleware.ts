import { withMiddlewareAuthRequired } from '@auth0/nextjs-auth0/edge'

export default withMiddlewareAuthRequired()

export const config = {
  matcher: [
    '/profile',
    '/api/workouts/favorites/:path*',
    '/api/workouts/save/:path*',
    '/api/user/:path*'
  ]
} 