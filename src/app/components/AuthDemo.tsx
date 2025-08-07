'use client';

import { signIn, signOut, useSession } from 'next-auth/react';

export default function AuthDemo() {
  const { data: session, status } = useSession();
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
            {session.user?.email && (
              <div>
                <span className="font-medium">Email:</span> {session.user.email}
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
    </div>
  );
}


