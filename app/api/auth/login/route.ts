import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { authenticateAdminCredentials, createAdminSession } from '@/lib/auth';
import { buildLoginRateLimitKey, consumeRateLimit } from '@/lib/rate-limit';
import { getRedis } from '@/lib/redis';
import { getClientIp, isSameOriginRequest } from '@/lib/request-ip';

const loginSchema = z.object({
  email: z.string().trim().email('Please enter a valid email address.'),
  password: z.string().min(1, 'Password is required.'),
});

export async function POST(request: NextRequest) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: 'Invalid request origin.' }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON payload.' }, { status: 400 });
  }

  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Invalid credentials format.' },
      { status: 400 }
    );
  }

  const { email, password } = parsed.data;
  const ip = getClientIp(request);
  const rateKey = buildLoginRateLimitKey(ip, email);

  try {
    const rate = await consumeRateLimit(getRedis(), rateKey, 5, 900);
    if (!rate.allowed) {
      return NextResponse.json(
        {
          error: `Too many sign-in attempts. Please wait ${Math.ceil(rate.retryAfterSeconds / 60)} minute(s) and try again.`,
          retryAfterSeconds: rate.retryAfterSeconds,
        },
        {
          status: 429,
          headers: { 'Retry-After': String(rate.retryAfterSeconds) },
        }
      );
    }
  } catch (err) {
    console.warn('[auth/login] Redis rate limit check skipped:', err instanceof Error ? err.message : err);
  }

  const user = await authenticateAdminCredentials(email, password);
  if (!user) {
    return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 });
  }

  // Reset rate limit counter upon valid login
  try {
    await getRedis().del(rateKey);
  } catch {
    // Non-fatal
  }

  await createAdminSession(user.id, {
    ipAddress: ip,
    userAgent: request.headers.get('user-agent')?.slice(0, 300) ?? null,
  });

  return NextResponse.json({
    ok: true,
    user: { id: user.id, email: user.email, name: user.name },
  });
}
