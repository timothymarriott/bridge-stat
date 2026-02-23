import { Hono } from "hono";
import { logger } from "hono/logger";
import api from "./api";
import { auth } from "./api/auth";

const app = new Hono<{
	Bindings: Env;
	Variables: {
		user: typeof auth.$Infer.Session.user | null;
		session: typeof auth.$Infer.Session.session | null;
	};
}>();

app.use("*", logger());

app.use("*", async (c, next) => {
	const session = await auth.api.getSession({ headers: c.req.raw.headers });

	if (!session) {
		c.set("user", null);
		c.set("session", null);
		await next();
		return;
	}

	c.set("user", session.user);
	c.set("session", session.session);
	await next();
});

app.route("/api", api);

export default app;
