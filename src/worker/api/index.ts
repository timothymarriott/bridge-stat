import { Hono } from "hono";
import admin from "./admin";
import { cors } from "hono/cors";
import { env } from "cloudflare:workers";
import { auth, authRoute } from "./auth";
import token from "./token";
import { link_requests, user_profiles } from "../schema";
import { eq } from "drizzle-orm";
import { db } from "../database";
import { FetchMojangProfile } from "../mojang";

const api = new Hono<{
	Bindings: Env;
	Variables: {
		user: typeof auth.$Infer.Session.user | null;
		session: typeof auth.$Infer.Session.session | null;
	};
}>();

api.get("/", (c) => c.json({ name: "Testing" }));

api.route("/admin", admin);
api.route("/token", token);

api.post("/link/request/:uuid", async (c) => {
	const { uuid } = c.req.param();
	const user = c.get("user");

	if (!user) return c.body("Unauthorized", 401);

	const [res] = await db
		.select()
		.from(user_profiles)
		.where(eq(user_profiles.id, user.id))
		.limit(1);

	if (res.awaiting_link_request > 0) {
		return c.body("Already Requested", 401);
	}

	await db
		.update(user_profiles)
		.set({
			awaiting_link_request: 1,
		})
		.where(eq(user_profiles.id, user.id));

	const result = await db.insert(link_requests).values({
		user: user.id,
		uuid: uuid,
	});

	return c.json(result.success);
});

api.use(
	"/auth/*", // or replace with "*" to enable cors for all routes
	cors({
		origin: env.BETTER_AUTH_URL, // replace with your origin
		allowHeaders: ["Content-Type", "Authorization"],
		allowMethods: ["POST", "GET", "OPTIONS"],
		exposeHeaders: ["Content-Length"],
		maxAge: 600,
		credentials: true,
	}),
);

api.get("/profile/:uuid", async (c) => {
	const { uuid } = c.req.param();
	const user = c.get("user");

	if (!user) return c.body("Unauthorized", 401);

	return c.json(await FetchMojangProfile(uuid));
});

api.route("/auth", authRoute);

export default api;
