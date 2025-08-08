import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function GET() {
  const session = (await getServerSession(authOptions)) as
    | (Awaited<ReturnType<typeof getServerSession>> & {
        accessToken?: string;
        accessTokenExpiresAt?: number;
        tokenError?: string;
      })
    | null;
  // Echo minimal data and make an authenticated upstream call to verify token works
  try {
    const upstream = await fetch(process.env.XEENON_USERINFO_ENDPOINT!, {
      headers: {
        Authorization: session?.accessToken
          ? `Bearer ${session.accessToken}`
          : '',
      },
      cache: 'no-store',
    });

    const json = await upstream.json();

    return NextResponse.json({
      ok: upstream.ok,
      status: upstream.status,
      sessionHasToken: Boolean(session?.accessToken),
      upstreamBody: json,
      tokenExpiresAt: session?.accessTokenExpiresAt ?? null,
      tokenError: session?.tokenError ?? null,
    });
  } catch (e) {
    return NextResponse.json(
      {
        ok: false,
        error: 'Failed to call upstream',
        message: e instanceof Error ? e.message : String(e),
      },
      { status: 500 }
    );
  }
}
