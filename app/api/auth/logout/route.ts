import { NextRequest, NextResponse } from 'next/server';
import { clearCurrentSession } from '@/lib/auth';
import { isSameOriginRequest } from '@/lib/request-ip';

export async function POST(request: NextRequest) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: 'Invalid request origin.' }, { status: 403 });
  }

  await clearCurrentSession();
  return NextResponse.json({ ok: true });
}
