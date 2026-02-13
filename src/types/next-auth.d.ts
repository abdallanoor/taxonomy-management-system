import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface User {
    id: string;
    isAdmin: boolean;
    canEditCategories: boolean;
    assignedMaterials: string[];
  }

  interface Session {
    user: User;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    isAdmin: boolean;
    canEditCategories: boolean;
    assignedMaterials: string[];
  }
}
