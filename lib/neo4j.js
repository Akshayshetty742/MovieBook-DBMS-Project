import { createHash } from "node:crypto";
import neo4j from "neo4j-driver";

const globalForNeo4j = globalThis;

export function getNeo4jDriver() {
    const password = process.env.NEO4J_PASSWORD;

    if (!password) {
        throw new Error("NEO4J_PASSWORD is not configured.");
    }

    const uri = process.env.NEO4J_URI || "neo4j://127.0.0.1:7687";
    const user = process.env.NEO4J_USER || "neo4j";
    const configurationFingerprint = createHash("sha256")
        .update(`${uri}\0${user}\0${password}`)
        .digest("hex");
    const cachedDriver = globalForNeo4j.movieBookNeo4jDriver;

    if (
        !cachedDriver ||
        globalForNeo4j.movieBookNeo4jConfiguration !== configurationFingerprint
    ) {
        globalForNeo4j.movieBookNeo4jDriver = neo4j.driver(
            uri,
            neo4j.auth.basic(user, password)
        );
        globalForNeo4j.movieBookNeo4jConfiguration = configurationFingerprint;

        if (cachedDriver) {
            cachedDriver.close().catch((error) => {
                console.error(
                    "Previous Neo4j driver close failed:",
                    error.code || error.name
                );
            });
        }
    }

    return globalForNeo4j.movieBookNeo4jDriver;
}

export function getNeo4jDatabase() {
    return process.env.NEO4J_DATABASE || "neo4j";
}
