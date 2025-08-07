import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  // Vérifier si c'est une route protégée (dashboard)
  if (pathname.startsWith('/dashboard')) {
    // Vérifier la présence d'un token de session Supabase
    const supabaseAccessToken = request.cookies.get('sb-access-token') ||
                               request.cookies.get('supabase-auth-token') ||
                               request.cookies.get('sb-localhost-auth-token');
    if (!supabaseAccessToken) {
      console.log('🔒 Accès dashboard refusé - pas de session Supabase');
      const loginUrl = new URL('/auth/supabase-login', request.url);
      loginUrl.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(loginUrl);
    }
    console.log('✅ Accès dashboard autorisé - session Supabase présente');
  }
  // Headers de sécurité basiques
  const response = NextResponse.next();
  // Headers de sécurité
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  // CORS pour les APIs
  if (pathname.startsWith('/api/')) {
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  }
  return response;
}
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
};