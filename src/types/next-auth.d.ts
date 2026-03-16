import "next-auth";
import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: string;
      tenantId: string;
      bahasa: string;
    } & DefaultSession["user"];
  }

  interface User {
    role: string;
    tenantId: string;
    bahasa: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: string;
    tenantId: string;
    bahasa: string;
  }
}
