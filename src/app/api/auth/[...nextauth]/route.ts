import NextAuth from 'next-auth';
import GitHubProvider from 'next-auth/providers/github';
import CredentialsProvider from 'next-auth/providers/credentials';
import { NextAuthOptions } from 'next-auth';
const authOptions: NextAuthOptions = {
  providers: [
    // GitHub Provider
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    }),
    // Credentials Provider (pour notre système existant)
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }
        try {
          // Appel direct à l'API de login
          const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3002';
          console.log('🔍 NextAuth utilise baseUrl:', baseUrl);
          const response = await fetch(`${baseUrl}/api/auth/login`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              email: credentials.email,
              password: credentials.password,
            }),
          });
          if (!response.ok) {
            console.log('❌ Échec authentification:', response.status);
            return null;
          }
          const user = await response.json();
          if (user && user.id) {
            console.log('✅ Authentification réussie pour:', user.email);
            return {
              id: user.id,
              email: user.email,
              name: user.full_name || user.name,
              image: user.avatar_url,
            };
          }
          return null;
        } catch (error) {
          console.error('❌ Erreur authentification:', error);
          return null;
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user, account }) {
      // Persist the OAuth access_token and user info to the token right after signin
      if (account && user) {
        token.accessToken = account.access_token;
        token.provider = account.provider;
        token.userId = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      // Send properties to the client
      if (token) {
        session.accessToken = token.accessToken as string;
        session.provider = token.provider as string;
        session.user.id = token.userId as string;
      }
      return session;
    },
    async signIn({ user, account, profile }) {
      // Permettre la connexion pour tous les providers
      if (account?.provider === 'github') {
        // Optionnel : vérifier si l'utilisateur GitHub est autorisé
        return true;
      }
      if (account?.provider === 'credentials') {
        return user ? true : false;
      }
      return true;
    },
    async redirect({ url, baseUrl }) {
      // Rediriger vers le dashboard après connexion
      if (url.startsWith('/')) return `${baseUrl}${url}`;
      else if (new URL(url).origin === baseUrl) return url;
      return `${baseUrl}/dashboard`;
    }
  },
  pages: {
    signIn: '/auth/login',
    signUp: '/auth/register',
    error: '/auth/error',
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET,
};
const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };