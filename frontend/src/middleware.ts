import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Check both cookie and session storage
  const authToken = request.cookies.get('authToken')?.value || 
                   (typeof window !== 'undefined' ? sessionStorage.getItem('authToken') : null)
  
  console.log('Auth token in middleware:', authToken)
  
  // If trying to access login page while already authenticated
  if (request.nextUrl.pathname === '/login' && authToken) {
    return NextResponse.redirect(new URL('/userprofile', request.url))
  }

  // If trying to access protected pages without auth
  if (request.nextUrl.pathname.startsWith('/userprofile') && !authToken) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/login', '/userprofile/:path*']
} 