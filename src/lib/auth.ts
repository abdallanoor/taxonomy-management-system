import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import dbConnect from "@/lib/mongodb";
import { User } from "@/models";
import bcrypt from "bcryptjs";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          throw new Error("يرجى إدخال اسم المستخدم وكلمة المرور");
        }

        await dbConnect();

        const user = await User.findOne({ username: credentials.username });

        if (!user) {
          throw new Error("بيانات الدخول غير صحيحة");
        }

        const isMatch = await bcrypt.compare(
          credentials.password,
          user.password || ""
        );

        if (!isMatch) {
          throw new Error("بيانات الدخول غير صحيحة");
        }

        return {
          id: user._id.toString(),
          name: user.username,
          isAdmin: user.isAdmin,
          canEditCategories: user.canEditCategories,
          assignedMaterials: user.assignedMaterials.map((id) => id.toString()),
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 24 hours
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.isAdmin = user.isAdmin;
        token.canEditCategories = user.canEditCategories;
        token.assignedMaterials = user.assignedMaterials;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.isAdmin = token.isAdmin as boolean;
        session.user.canEditCategories = token.canEditCategories as boolean;
        session.user.assignedMaterials = token.assignedMaterials as string[];
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  secret: process.env.NEXTAUTH_SECRET,
};
