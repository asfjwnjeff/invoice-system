import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

const MOCK_USERS: Record<string, { id: string; name: string; email: string; password: string; role: string }> = {
  "admin@invoice.local": { id: "1", name: "系统管理员", email: "admin@invoice.local", password: "admin123", role: "admin" },
  "operator@invoice.local": { id: "2", name: "开票员", email: "operator@invoice.local", password: "operator123", role: "operator" },
  "finance@invoice.local": { id: "3", name: "财务主管", email: "finance@invoice.local", password: "finance123", role: "finance_manager" },
};

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: { label: "邮箱", type: "email" },
        password: { label: "密码", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials.email as string;
        const password = credentials.password as string;
        const user = MOCK_USERS[email];
        if (!user || user.password !== password) return null;
        return { id: user.id, name: user.name, email: user.email, role: user.role };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) { token.role = (user as { role: string }).role; token.id = user.id; }
      return token;
    },
    async session({ session, token }) {
      if (session.user) { session.user.role = token.role as string; session.user.id = token.id as string; }
      return session;
    },
  },
  pages: { signIn: "/login" },
  session: { strategy: "jwt" },
});
