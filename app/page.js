import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import HomeClient from "@/app/home-client";
import { getAuthenticatedUserByToken } from "@/lib/auth";

export const runtime = "nodejs";

export default async function HomePage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("moviebook_session")?.value || "";
  const user = token ? await getAuthenticatedUserByToken(token) : null;

  if (!user) redirect("/login");
  return <HomeClient />;
}
