import { getAuthenticatedUser } from "@/lib/auth";

export const runtime = "nodejs";

export async function GET(request) {
    try {
        const user = await getAuthenticatedUser(request);
        if (!user) {
            return Response.json(
                { success: false, error: "Sign in to access your account." },
                { status: 401 }
            );
        }

        return Response.json({ success: true, user });
    } catch (error) {
        console.error("Account session lookup failed:", error.code || error.name);
        return Response.json(
            { success: false, error: "Unable to check account session." },
            { status: 500 }
        );
    }
}
