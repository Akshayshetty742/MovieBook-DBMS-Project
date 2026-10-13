import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getAuthenticatedUserByToken } from "@/lib/auth";

export async function requirePageUser() {
  const token = (await cookies()).get("moviebook_session")?.value || "";
  const user = token ? await getAuthenticatedUserByToken(token) : null;
  if (!user) redirect("/login");
  return user;
}
