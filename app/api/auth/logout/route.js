import {
    clearSessionCookie,
    revokeUserSession,
} from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(request) {
    try {
        await revokeUserSession(request);
        return Response.json(
            { success: true },
            { headers: { "Set-Cookie": clearSessionCookie() } }
        );
    } catch (error) {
        console.error("Account logout failed:", error.code || error.name);
        return Response.json(
            { success: false, error: "Unable to sign out. Please try again." },
            { status: 500 }
        );
    }
}
