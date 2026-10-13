import pool from "@/lib/db";
import {
    createSessionCookie,
    createUserSession,
    hashPassword,
} from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(request) {
    try {
        const body = await request.json();
        const name = typeof body.name === "string" ? body.name.trim() : "";
        const email = typeof body.email === "string"
            ? body.email.trim().toLowerCase()
            : "";
        const password = typeof body.password === "string" ? body.password : "";

        if (name.length < 2 || name.length > 100) {
            return Response.json(
                { success: false, error: "Name must be between 2 and 100 characters." },
                { status: 400 }
            );
        }

        if (
            email.length > 100 ||
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
        ) {
            return Response.json(
                { success: false, error: "Provide a valid email address." },
                { status: 400 }
            );
        }

        if (password.length < 8 || password.length > 256) {
            return Response.json(
                { success: false, error: "Password must be 8 to 256 characters." },
                { status: 400 }
            );
        }

        const passwordHash = await hashPassword(password);
        const connection = await pool.getConnection();
        let user;
        let token;
        let transactionStarted = false;
        try {
            await connection.beginTransaction();
            transactionStarted = true;
            const [result] = await connection.execute(
                `INSERT INTO users (name, email, password_hash, role)
                 VALUES (?, ?, ?, 'CUSTOMER')`,
                [name, email, passwordHash]
            );
            token = await createUserSession(result.insertId, connection);
            user = {
                user_id: result.insertId,
                name,
                email,
                role: "CUSTOMER",
            };
            await connection.commit();
            transactionStarted = false;
        } catch (error) {
            if (transactionStarted) await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }

        return Response.json(
            {
                success: true,
                user,
            },
            {
                status: 201,
                headers: { "Set-Cookie": createSessionCookie(token) },
            }
        );
    } catch (error) {
        if (error.code === "ER_DUP_ENTRY") {
            return Response.json(
                { success: false, error: "An account with this email already exists." },
                { status: 409 }
            );
        }

        console.error("Account registration failed:", error.code || error.name);
        return Response.json(
            { success: false, error: "Unable to create the account. Check database setup." },
            { status: 500 }
        );
    }
}
