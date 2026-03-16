import { env } from "cloudflare:workers";
import { drizzle } from "drizzle-orm/d1";
import { Context, Input } from "hono";
import { better_auth } from "./better_auth";

if (env.bridge == undefined) {
	throw new Error("No database provided.");
}
export let db = drizzle(env.bridge);

export function UpdateDB(
	c: Context<
		{
			Bindings: Env;
			Variables: {
				user: typeof better_auth.$Infer.Session.user | null;
				session: typeof better_auth.$Infer.Session.session | null;
			};
		},
		"*",
		Input
	>,
) {
	if (c.env.bridge == undefined) {
		throw new Error("No database provided.");
	}
	db = drizzle(c.env.bridge);
}
