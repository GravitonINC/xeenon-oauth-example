import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import {
  authOptions,
  XEENON_CLIENT_ID,
  XEENON_CLIENT_SECRET,
} from '@/app/api/auth/[...nextauth]/route';

export async function POST() {
  const session = (await getServerSession(authOptions)) as
    | (Awaited<ReturnType<typeof getServerSession>> & {
        accessToken?: string;
        refreshToken?: string;
      })
    | null;

  if (!session?.accessToken) {
    return NextResponse.json(
      { ok: false, error: 'No access token in session' },
      { status: 401 }
    );
  }

  try {
    const params = new URLSearchParams({
      token: session.refreshToken ?? session.accessToken,
      token_type_hint: session.refreshToken ? 'refresh_token' : 'access_token',
      client_id: XEENON_CLIENT_ID,
      client_secret: XEENON_CLIENT_SECRET,
    });

    const res = await fetch(process.env.XEENON_REVOKE_TOKEN_ENDPOINT!, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params,
      cache: 'no-store',
    });

    // RFC7009 says success response may be 200 with empty body; treat non-2xx as error
    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json(
        { ok: false, status: res.status, body: text },
        { status: 500 }
      );
    }

    // After successful revocation, clear the session on the client side
    // We respond with a directive that the UI can use to sign out
    return NextResponse.json({ ok: true, shouldSignOut: true });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : String(e) },
      { status: 500 }
    );
  }
}
