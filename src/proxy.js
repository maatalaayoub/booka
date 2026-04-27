import { createMiddlewareClient } from '@/lib/supabase/middleware-client';
import { NextResponse } from 'next/server';
import { verifyAccessTokenEdge } from '@/lib/access-token-edge';

// Supported locales
const locales = ['en', 'fr', 'ar'];
const defaultLocale = 'fr';

// Route matching helpers
function matchRoute(pathname, patterns) {
  return patterns.some((p) => {
    const regex = new RegExp('^' + p.replace(':path*', '.*') + '$');
    return regex.test(pathname);
  });
}

const isBusinessRoute = (pathname) =>
  matchRoute(pathname, ['/business/:path*', '/:locale/business/:path*'].map(p => p.replace('/:locale', '/[a-z]{2}')));
const isWorkerRoute = (pathname) =>
  matchRoute(pathname, ['/worker/:path*', '/:locale/worker/:path*'].map(p => p.replace('/:locale', '/[a-z]{2}')));
const isAdminRoute = (pathname) =>
  matchRoute(pathname, ['/admin/:path*', '/:locale/admin/:path*'].map(p => p.replace('/:locale', '/[a-z]{2}')));

function isProtectedRoute(pathname) {
  const stripped = pathname.replace(/^\/[a-z]{2}/, '');
  return (
    stripped.startsWith('/business/') ||
    stripped.startsWith('/worker/') ||
    stripped.startsWith('/admin/')
  );
}

// Helper to get locale from pathname
function getLocaleFromPath(pathname) {
  const segments = pathname.split('/').filter(Boolean);
  if (segments.length > 0 && locales.includes(segments[0])) {
    return segments[0];
  }
  return null;
}

// Helper to get locale from request
function getPreferredLocale(request) {
  const acceptLanguage = request.headers.get('Accept-Language');
  if (acceptLanguage) {
    const preferredLocale = acceptLanguage
      .split(',')
      .map((lang) => lang.split(';')[0].trim().substring(0, 2))
      .find((lang) => locales.includes(lang));
    if (preferredLocale) return preferredLocale;
  }
  return defaultLocale;
}

export async function proxy(req) {
  const pathname = req.nextUrl.pathname;

  // Skip static files
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/images') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // Create Supabase middleware client
  const { supabase, response } = createMiddlewareClient(req);

  const isAccessPage = pathname === '/access';
  const isAccessApi = pathname.startsWith('/api/access');

  let gateActive = true;
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/site_access?select=global_access_enabled&limit=1`, {
      method: 'GET',
      headers: {
        'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Profile': 'application/json'
      },
      // Important to skip caching so it updates instantly
      cache: 'no-store'
    });
    
    if (res.ok) {
      const data = await res.json();
      if (data && data.length > 0 && data[0].global_access_enabled === false) {
        gateActive = false;
      }
    }
  } catch (error) {
    console.error('Error checking site_access in proxy:', error);
  }

  if (gateActive) {
    if (!isAccessPage && !isAccessApi && !pathname.startsWith('/api')) {
      const accessCookie = req.cookies.get('site_access');
      const isValid = accessCookie ? await verifyAccessTokenEdge(accessCookie.value) : false;
      if (!isValid) return NextResponse.redirect(new URL('/access', req.url));
    }
  } else {
    if (isAccessPage) return NextResponse.redirect(new URL('/', req.url));
  }

  if (isAccessPage || isAccessApi) {
    return NextResponse.next();
  }

  const pathnameLocale = getLocaleFromPath(pathname);
  const hasLocale = pathnameLocale !== null;

  if (!hasLocale && !pathname.startsWith('/api')) {
    const locale = getPreferredLocale(req);
    const newUrl = new URL(`/${locale}${pathname}`, req.url);
    newUrl.search = req.nextUrl.search;
    const redirectResponse = NextResponse.redirect(newUrl);
    response.cookies.getAll().forEach(cookie => redirectResponse.cookies.set(cookie.name, cookie.value, cookie));
    return redirectResponse;
  }

  const locale = pathnameLocale || defaultLocale;

  // Refresh session — this is the key call that keeps cookies alive
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const userId = user?.id || null;

  // Protected routes — redirect unauthenticated users
  if (isProtectedRoute(pathname) && !userId) {
    const stripped = pathname.replace(/^\/[a-z]{2}/, '');
    if (stripped.startsWith('/business/') || stripped.startsWith('/worker/') || stripped.startsWith('/admin/')) {
      return NextResponse.redirect(new URL(`/${locale}/auth/business/sign-in`, req.url));
    }
  }

  return response;
}

export const config = {
  matcher: [
    // Skip Next.js internals and static files
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};





