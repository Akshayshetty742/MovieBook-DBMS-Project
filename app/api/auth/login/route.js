import pool from "@/lib/db";
import {
    createSessionCookie,
    createUserSession,
    verifyPassword,
} from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(request) {
    try {
        const body = await request.json();
        const email = typeof body.email === "string"
            ? body.email.trim().toLowerCase()
            : "";
        const password = typeof body.password === "string" ? body.password : "";

        if (
            email.length > 100 ||
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
            password.length === 0 ||
            password.length > 256
        ) {
            return Response.json(
                { success: false, error: "Enter a valid email and password." },
                { status: 400 }
            );
        }

        const [users] = await pool.execute(
            `SELECT user_id, name, email, role, password_hash
             FROM users WHERE email = ? LIMIT 1`,
            [email]
        );
        const user = users[0];
        const passwordMatches = await verifyPassword(
            password,
            user?.password_hash
        );

        if (!user || !passwordMatches) {
            return Response.json(
                { success: false, error: "Email or password is incorrect." },
                { status: 401 }
            );
        }

        const token = await createUserSession(user.user_id);
        return Response.json(
            {
                success: true,
                user: {
                    user_id: user.user_id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                },
            },
            { headers: { "Set-Cookie": createSessionCookie(token) } }
        );
    } catch (error) {
        console.error("Account login failed:", error.code || error.name);
        return Response.json(
            { success: false, error: "Unable to sign in. Check database setup." },
            { status: 500 }
        );
    }
}
