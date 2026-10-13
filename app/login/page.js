import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getAuthenticatedUserByToken } from "@/lib/auth";
import AuthForm from "@/components/auth-form";

export const runtime = "nodejs";

export default async function LoginPage() {
  const token = (await cookies()).get("moviebook_session")?.value || "";
  if (token && await getAuthenticatedUserByToken(token)) redirect("/");
  return <AuthForm mode="login" />;
}
