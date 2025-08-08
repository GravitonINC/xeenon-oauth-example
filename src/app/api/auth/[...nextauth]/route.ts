import NextAuth, {
  type NextAuthOptions,
  type Account,
  type Session,
} from 'next-auth';
import type { JWT } from 'next-auth/jwt';

// These constants are reused across routes
export const XEENON_TOKEN_ENDPOINT = process.env.XEENON_TOKEN_ENDPOINT!;
export const XEENON_USERINFO_ENDPOINT = process.env.XEENON_USERINFO_ENDPOINT!;
export const XEENON_CLIENT_ID = process.env.XEENON_CLIENT_ID!;
export const XEENON_CLIENT_SECRET = process.env.XEENON_CLIENT_SECRET!;

type JWTToken = {
  name?: string | null;
  email?: string | null;
  picture?: string | null;
  sub?: string;
  // Custom fields we add
  accessToken?: string;
  refreshToken?: string;
  accessTokenExpiresAt?: number; // epoch ms
  error?: string;
};

type XeenonProfile = {
  address: string;
  displayName?: string | null;
  profileImage?: string | null;
};

async function refreshAccessToken(token: JWTToken): Promise<JWTToken> {
  try {
    const params = new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: XEENON_CLIENT_ID,
      client_secret: XEENON_CLIENT_SECRET,
      refresh_token: token.refreshToken ?? '',
    });

    const response = await fetch(XEENON_TOKEN_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params,
      cache: 'no-store',
    });

    const refreshed = (await response.json()) as {
      access_token: string;
      refresh_token?: string;
      token_type: string;
      expires_in: number; // seconds
      scope?: string;
    };

    if (!response.ok) {
      // Include minimal info to help debugging in dev
      return { ...token, error: 'RefreshTokenFetchError' };
    }

    const newExpiry = Date.now() + (refreshed.expires_in ?? 0) * 1000 - 60_000; // refresh 60s early

    return {
      ...token,
      accessToken: refreshed.access_token,
      refreshToken: refreshed.refresh_token ?? token.refreshToken,
      accessTokenExpiresAt: newExpiry,
      error: undefined,
    };
  } catch {
    return { ...token, error: 'RefreshTokenUnexpectedError' };
  }
}

export const authOptions: NextAuthOptions = {
  session: { strategy: 'jwt' },
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    {
      id: 'xeenon',
      name: 'Xeenon',
      type: 'oauth',
      authorization: {
        url: process.env.XEENON_AUTHORIZE_ENDPOINT!,
        params: {
          scope: 'general chat:read chat:write follow:write reactions:write',
          code_challenge_method: 'S256',
        },
      },
      checks: ['pkce', 'state'],
      token: XEENON_TOKEN_ENDPOINT,
      clientId: XEENON_CLIENT_ID,
      clientSecret: XEENON_CLIENT_SECRET,
      userinfo: XEENON_USERINFO_ENDPOINT,
      profile(profile: XeenonProfile) {
        return {
          id: profile.address,
          name: profile.displayName,
          image: profile.profileImage,
        };
      },
    },
  ],
  callbacks: {
    async jwt({ token, account }: { token: JWT; account?: Account | null }) {
      const jwtToken = token as JWTToken;
      // Initial sign-in: persist tokens returned by provider
      if (account) {
        const expiresAt =
          // Use provider-reported expiry if available; fall back to 10 minutes for testing
          (account.expires_at
            ? account.expires_at * 1000
            : Date.now() + 60 * 1000) - 60_000; // refresh early by 60s

        return {
          ...jwtToken,
          accessToken: account.access_token,
          refreshToken: account.refresh_token,
          accessTokenExpiresAt: expiresAt,
        } satisfies JWTToken;
      }

      // If token is not expired, return it
      if (
        jwtToken.accessToken &&
        jwtToken.accessTokenExpiresAt &&
        Date.now() < jwtToken.accessTokenExpiresAt
      ) {
        return jwtToken;
      }

      // Access token expired, try to refresh
      return await refreshAccessToken(jwtToken);
    },
    async session({ session, token }: { session: Session; token: JWT }) {
      const jwtToken = token as JWTToken;
      // Expose token and expiry to the client for testing/diagnostics
      return {
        ...session,
        accessToken: jwtToken.accessToken,
        accessTokenExpiresAt: jwtToken.accessTokenExpiresAt,
        tokenError: jwtToken.error,
        // Include refreshToken so server routes (like /api/token/revoke) can access it via getServerSession
        // This is for demo/testing purposes; avoid exposing refresh tokens to the client in production apps.
        refreshToken: jwtToken.refreshToken,
      } as typeof session & {
        accessToken?: string;
        accessTokenExpiresAt?: number;
        tokenError?: string;
        refreshToken?: string;
      };
    },
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
