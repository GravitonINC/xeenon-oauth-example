'use client';

import { signIn, signOut, useSession } from 'next-auth/react';

type ExtendedSession = ReturnType<typeof useSession> extends { data: infer D }
  ? (D & { accessToken?: string; accessTokenExpiresAt?: number; tokenError?: string }) | null
  : null;

export default function AuthDemo() {
  const { data: sessionRaw, status } = useSession();
  const session = (sessionRaw as ExtendedSession) ?? null;
  const isAuthenticated = status === 'authenticated' && Boolean(session);

  return (
    <div className="flex flex-col gap-4 border rounded-lg p-4 max-w-[480px] w-full">
      <h2 className="text-lg font-semibold">OAuth Demo</h2>

      <div className="text-sm">
        <div>
          <span className="font-medium">Status:</span> {status}
        </div>
        {session ? (
          <div className="mt-1">
            {session.user?.name && (
              <div>
                <span className="font-medium">Name:</span> {session.user.name}
              </div>
            )}
            {session.user?.image && (
              <div>
                <img src={session.user.image} alt="Profile" className="w-10 h-10 rounded-full" />
              </div>
            )}
            {Boolean(session?.accessToken) && (
              <div className="mt-2 break-all">
                <span className="font-medium">Access token:</span> {String(session?.accessToken)}
              </div>
            )}
            {Boolean(session?.accessTokenExpiresAt) && (
              <div className="mt-1">
                <span className="font-medium">Token expires at:</span>{' '}
                {new Date(Number(session?.accessTokenExpiresAt)).toLocaleTimeString()}
              </div>
            )}
            {Boolean(session?.tokenError) && (
              <div className="mt-1 text-red-600">
                <span className="font-medium">Token error:</span> {String(session?.tokenError)}
              </div>
            )}
          </div>
        ) : (
          <div className="mt-1">Not authenticated</div>
        )}
      </div>

      <div className="flex gap-2">
        {isAuthenticated ? (
          <button
            className="px-3 py-2 rounded-md border text-sm"
            onClick={() => signOut()}
          >
            Sign out
          </button>
        ) : (
          <button
            className="px-3 py-2 rounded-md bg-black text-white dark:bg-white dark:text-black text-sm"
            onClick={() => signIn('xeenon')}
          >
            Sign in with Xeenon
          </button>
        )}
      </div>
      {isAuthenticated && (
        <div className="flex gap-2">
          <button
            className="px-3 py-2 rounded-md border text-sm"
            onClick={async () => {
              const res = await fetch('/api/me');
              const data = await res.json();
              alert(JSON.stringify(data, null, 2));
            }}
          >
            Call /api/me (uses token)
          </button>
          <button
            className="px-3 py-2 rounded-md border text-sm"
            onClick={async () => {
              // Force re-fetch session to trigger jwt callback and refresh if needed
              const res = await fetch('/api/auth/session?update', { cache: 'no-store' });
              const data = await res.json();
              alert('Session updated. expiresAt=' + data.accessTokenExpiresAt);
            }}
          >
            Refresh session now
          </button>
        </div>
      )}
    </div>
  );
}


