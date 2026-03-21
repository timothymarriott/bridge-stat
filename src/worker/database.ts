import { env } from "cloudflare:workers";
import { drizzle } from "drizzle-orm/d1";

export let db = drizzle(env.bridge);

export function UpdateDB(database: D1Database | undefined) {
	if (database == undefined) {
		throw new Error("No database provided.");
	}
	db = drizzle(database);
}
