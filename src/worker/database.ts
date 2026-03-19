import { env } from "cloudflare:workers";
import { drizzle } from "drizzle-orm/d1";

if (env.bridge == undefined) {
	throw new Error("No database provided.");
}
export let db = drizzle(env.bridge);

export function UpdateDB(database: D1Database | undefined) {
	if (database == undefined) {
		throw new Error("No database provided.");
	}
	db = drizzle(database);
}
