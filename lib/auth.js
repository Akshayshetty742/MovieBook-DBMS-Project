import { createHash, randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import pool from "@/lib/db";

const scrypt = promisify(scryptCallback);
const SESSION_COOKIE = "moviebook_session";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

function getCookieValue(request, name) {
    const cookieHeader = request.headers.get("cookie") || "";
    const entry = cookieHeader
        .split(";")
        .map((cookie) => cookie.trim())
        .find((cookie) => cookie.startsWith(`${name}=`));

    return entry ? entry.slice(name.length + 1) : "";
}

function hashToken(token) {
    return createHash("sha256").update(token).digest("hex");
}

export async function hashPassword(password) {
    const salt = randomBytes(16);
    const key = await scrypt(password, salt, 64);
    return `scrypt$${salt.toString("hex")}$${key.toString("hex")}`;
}

export async function verifyPassword(password, storedHash) {
    const [algorithm, saltHex, keyHex] = String(storedHash || "").split("$");
    if (
        algorithm !== "scrypt" ||
        !/^[a-f0-9]{32}$/i.test(saltHex || "") ||
        !/^[a-f0-9]{128}$/i.test(keyHex || "")
    ) {
        return false;
    }

    const expected = Buffer.from(keyHex, "hex");
    const actual = await scrypt(password, Buffer.from(saltHex, "hex"), expected.length);
    return timingSafeEqual(expected, actual);
}

export function createSessionCookie(token) {
    const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
    return `${SESSION_COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${SESSION_MAX_AGE_SECONDS}${secure}`;
}

export function clearSessionCookie() {
    const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
    return `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secure}`;
}

export async function createUserSession(userId, executor = pool) {
    const token = randomBytes(32).toString("hex");
    const tokenHash = hashToken(token);
    await executor.execute(
        `INSERT INTO user_sessions (user_id, token_hash, expires_at)
         VALUES (?, ?, DATE_ADD(UTC_TIMESTAMP(), INTERVAL 7 DAY))`,
        [userId, tokenHash]
    );
    return token;
}

export async function getAuthenticatedUser(request) {
    const token = getCookieValue(request, SESSION_COOKIE);
    return getAuthenticatedUserByToken(token);
}

export async function getAuthenticatedUserByToken(token) {
    if (!/^[a-f0-9]{64}$/i.test(token)) return null;

    const [users] = await pool.execute(
        `SELECT u.user_id, u.name, u.email, u.role
         FROM user_sessions session
         JOIN users u ON u.user_id = session.user_id
         WHERE session.token_hash = ?
           AND session.expires_at > UTC_TIMESTAMP()
         LIMIT 1`,
        [hashToken(token)]
    );

    return users[0] || null;
}

export async function revokeUserSession(request) {
    const token = getCookieValue(request, SESSION_COOKIE);
    if (!/^[a-f0-9]{64}$/i.test(token)) return;

    await pool.execute("DELETE FROM user_sessions WHERE token_hash = ?", [
        hashToken(token),
    ]);
}

export const sessionMaxAgeSeconds = SESSION_MAX_AGE_SECONDS;
