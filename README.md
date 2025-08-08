# Xeenon OAuth2 Integration Example

This is a Next.js application demonstrating how to implement OAuth2 authentication with Xeenon using NextAuth.js. The example includes token management, refresh token handling, and proper session management.

## Features

- OAuth2 Authorization Code flow with PKCE (Proof Key for Code Exchange)
- Access token and refresh token management
- Automatic token refresh when tokens expire
- Token revocation functionality
- Server-side authentication for API routes
- User profile and session information display

## Prerequisites

- Node.js 18+ and Yarn
- Xeenon OAuth2 application credentials
- Access to Xeenon OAuth2 endpoints

## Environment Setup

Create a `.env.local` file in the root directory with the following variables:

```env
# NextAuth Configuration
NEXTAUTH_URL=http://localhost:8080
NEXTAUTH_SECRET=your-nextauth-secret-here

# Xeenon OAuth2 Configuration
XEENON_CLIENT_ID=your-xeenon-client-id
XEENON_CLIENT_SECRET=your-xeenon-client-secret
XEENON_AUTHORIZE_ENDPOINT=https://main.public-api.xeenon.xyz/oauth/authorize
XEENON_TOKEN_ENDPOINT=https://main.public-api.xeenon.xyz/oauth/token
XEENON_USERINFO_ENDPOINT=https://main.public-api.xeenon.xyz/users/me
XEENON_REVOKE_TOKEN_ENDPOINT=https://main.public-api.xeenon.xyz/oauth/revoke
```

## Installation

1. Clone this repository
2. Install dependencies:
   ```bash
   yarn install
   ```
3. Set up your environment variables (see Environment Setup above)
4. Start the development server:
   ```bash
   yarn dev
   ```
5. Open [http://localhost:8080](http://localhost:8080) in your browser

## OAuth2 Flow Implementation

### 1. OAuth2 Provider Configuration

The Xeenon OAuth2 provider is configured in `src/app/api/auth/[...nextauth]/route.ts:84-106`:

```typescript
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
}
```

### 2. Token Management

The implementation includes sophisticated token management with automatic refresh:

- **Token Storage**: Access and refresh tokens are stored in JWT sessions
- **Token Refresh**: Automatic refresh 60 seconds before expiration (see `refreshAccessToken` function in `route.ts:32-75`)
- **Token Revocation**: Explicit token revocation endpoint at `/api/token/revoke`

### 3. Session Management

Sessions include extended information for debugging and token management:

```typescript
session: {
  ...session,
  accessToken: jwtToken.accessToken,
  accessTokenExpiresAt: jwtToken.accessTokenExpiresAt,
  tokenError: jwtToken.error,
  refreshToken: jwtToken.refreshToken, // For demo purposes only
}
```

## API Routes

### `/api/me` - User Info Endpoint

Tests the access token by making an authenticated request to Xeenon's userinfo endpoint. Returns:
- Upstream response status and body
- Token validity information
- Session details

### `/api/token/revoke` - Token Revocation

Revokes the current access or refresh token using Xeenon's revocation endpoint. Automatically signs out the user after successful revocation.

## UI Components

### AuthDemo Component

The main demo component (`src/app/components/AuthDemo.tsx`) provides:

- **Sign In/Out**: OAuth2 authentication flow
- **Session Display**: Shows user profile, token status, and expiry time
- **Token Testing**: Button to test API calls with the access token
- **Session Refresh**: Manual token refresh for testing
- **Token Revocation**: Revoke tokens and sign out

## Security Considerations

1. **PKCE**: Uses Proof Key for Code Exchange for enhanced security
2. **State Parameter**: Prevents CSRF attacks during the OAuth2 flow
3. **Token Expiry**: Implements proper token lifecycle management
4. **Secure Storage**: Tokens are stored in signed JWT sessions
5. **Environment Variables**: All sensitive configuration is externalized

## Development Notes

- The application runs on port 8080 by default (configured in `package.json:6,8`)
- Debug mode is enabled for NextAuth in development (`route.ts:79`)
- Refresh tokens are exposed to the client for demo purposes only - avoid this in production
- Token refresh happens 60 seconds before actual expiry to prevent race conditions

## File Structure

```
src/
├── app/
│   ├── api/
│   │   ├── auth/[...nextauth]/route.ts  # NextAuth configuration and OAuth2 setup
│   │   ├── me/route.ts                  # Protected API route example
│   │   └── token/revoke/route.ts        # Token revocation endpoint
│   ├── components/
│   │   └── AuthDemo.tsx                 # Main demo UI component
│   ├── layout.tsx                       # App layout with providers
│   ├── page.tsx                         # Home page
│   └── providers.tsx                    # NextAuth SessionProvider wrapper
```

## Troubleshooting

1. **Token Refresh Issues**: Check that `XEENON_TOKEN_ENDPOINT` is correct and accessible
2. **Authentication Errors**: Verify client ID, secret, and endpoint URLs
3. **CORS Issues**: Ensure your Xeenon OAuth2 app allows the callback URL
4. **Session Issues**: Check `NEXTAUTH_SECRET` and `NEXTAUTH_URL` configuration

## Learn More

- [NextAuth.js Documentation](https://next-auth.js.org/)
- [OAuth2 RFC 6749](https://tools.ietf.org/html/rfc6749)
- [PKCE RFC 7636](https://tools.ietf.org/html/rfc7636)
- [Next.js Documentation](https://nextjs.org/docs)