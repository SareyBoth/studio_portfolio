import type { NextRequest } from 'next/server';

export function getClientIp(request: NextRequest): string {
  const cfIp = request.headers.get('cf-connecting-ip');
  if (cfIp) return cfIp.trim();

  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0]?.trim() || '127.0.0.1';
  }

  const realIp = request.headers.get('x-real-ip');
  if (realIp) return realIp.trim();

  return '127.0.0.1';
}

export function isSameOriginRequest(request: NextRequest): boolean {
  const origin = request.headers.get('origin');
  if (!origin) return true; // Same-origin non-CORS or server calls

  const host = request.headers.get('x-forwarded-host') || request.headers.get('host');
  if (!host) return true;

  try {
    const parsedOrigin = new URL(origin);
    if (parsedOrigin.host === host) return true;

    const configuredUrl = process.env.NEXT_PUBLIC_APP_URL;
    if (configuredUrl) {
      const parsedConfigured = new URL(configuredUrl);
      if (parsedOrigin.origin === parsedConfigured.origin) return true;
    }
  } catch {
    return false;
  }

  return false;
}
