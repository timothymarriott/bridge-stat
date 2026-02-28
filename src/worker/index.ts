import { Context, Hono, Next } from "hono";
import { logger } from "hono/logger";
import api from "./api";
import { better_auth } from "./api/auth";
import { UpdateDB } from "./database";
import { TimeRequest } from "./requests";

export async function RequireAuthInformation(
	c: Context<{
		Bindings: Env;
		Variables: {
			user: typeof better_auth.$Infer.Session.user | null;
			session: typeof better_auth.$Infer.Session.session | null;
		};
	}>,
	next: Next,
) {
	const session = await TimeRequest(
		better_auth.api.getSession({ headers: c.req.raw.headers }),
		"Getting betterauth session",
	);

	if (!session) {
		c.set("user", null);
		c.set("session", null);
		await next();
		return;
	}

	c.set("user", session.user);
	c.set("session", session.session);
	await next();
}

const app = new Hono<{
	Bindings: Env;
	Variables: {
		user: typeof better_auth.$Infer.Session.user | null;
		session: typeof better_auth.$Infer.Session.session | null;
	};
}>()

	.use("*", logger())
	.use("*", async (c, next) => {
		try {
			UpdateDB(c);
		} catch (e) {
			console.error(e);
			return c.text("Failed to update DB", 503);
		}

		await next();
	})
	.route("/api", api);

export default app;
