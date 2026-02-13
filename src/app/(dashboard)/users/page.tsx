import { getUsers } from "@/lib/data";
import { UsersClient } from "@/components/users/UsersClient";

export const dynamic = "force-dynamic";

export default async function UsersPage() {
  const users = await getUsers();

  return <UsersClient initialUsers={users} />;
}
