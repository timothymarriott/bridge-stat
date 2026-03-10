import { env } from "cloudflare:workers";
import { drizzle } from "drizzle-orm/d1";
import { Context } from "hono";
import { better_auth } from "./better_auth";

export let db = drizzle(env.bridge!);

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
		any
	>,
) {
	db = drizzle(c.env.bridge!);
}
