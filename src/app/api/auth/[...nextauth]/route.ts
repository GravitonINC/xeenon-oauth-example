import NextAuth from 'next-auth';

const handler = NextAuth({
  providers: [
    {
      id: 'xeenon',
      name: 'Xeenon',
      type: 'oauth',
      authorization: {
        url: 'http://localhost:3000/oauth2/authorize',
        params: {
          scope: 'general chat:read chat:write follow:write reactions:write',
          code_challenge_method: 'S256',
        },
      },
      token: 'http://localhost:3000/oauth2/token',
      clientId: '55212a12-3dd3-457f-b804-ca80fe41fdec',
      clientSecret:
        '7cdbb81034c74a39f9bc535a916be21bfd94b82002f0f0b13eda7fb0948e88187ec50fa85419eceb',

      userinfo: 'http://localhost:3000/oauth2/userinfo',
      profile(profile) {
        return {
          id: profile.id,
          // name: profile.kakao_account?.profile.nickname,
          // email: profile.kakao_account?.email,
          // image: profile.kakao_account?.profile.profile_image_url,
        };
      },
    },
  ],
});

export { handler as GET, handler as POST };
