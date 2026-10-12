
import pool from "@/lib/db";

export async function GET() {
    try {
        const [rows] = await pool.query("SELECT 1 AS connected");

        return Response.json({
            success: true,
            message: "MySQL connection successful!",
            result: rows[0],
        });
    } catch (error) {
        console.error("MySQL test failed:", error.message);

        return Response.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}
