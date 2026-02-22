import { Hono } from "hono";
import { auth } from "./auth";
import { cors } from "hono/cors";
import { env } from "cloudflare:workers";
import { logger } from "hono/logger";
import { db } from "./database";
import { link_requests, user, user_profiles } from "./schema";
import { eq } from "drizzle-orm";
import { LinkRequestList, MCProfileResponse, UserProfile } from "./types";

const app = new Hono<{
	Bindings: Env;
	Variables: {
		user: typeof auth.$Infer.Session.user | null;
		session: typeof auth.$Infer.Session.session | null;
	};
}>();

const requireAdmin = async (c: any, next: any) => {
	const user = c.get("user");

	if (!user) {
		return c.body("Unauthorized", 401);
	}

	const [profile] = await db
		.select({ isAdmin: user_profiles.is_admin })
		.from(user_profiles)
		.where(eq(user_profiles.id, user.id))
		.limit(1);

	console.log(profile);

	if (profile.isAdmin == 0) {
		return c.body("Forbidden", 403);
	}

	return next();
};

app.use("*", logger());

console.log(env.BETTER_AUTH_URL);

app.use(
	"/api/auth/*", // or replace with "*" to enable cors for all routes
	cors({
		origin: env.BETTER_AUTH_URL, // replace with your origin
		allowHeaders: ["Content-Type", "Authorization"],
		allowMethods: ["POST", "GET", "OPTIONS"],
		exposeHeaders: ["Content-Length"],
		maxAge: 600,
		credentials: true,
	}),
);

app.on(["POST", "GET"], "/api/auth/*", (c) => {
	return auth.handler(c.req.raw);
});

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

app.use("/admin/*", requireAdmin);

app.use("/api/admin/*", requireAdmin);
app.use("/api/admin/", async (c) => {
	return c.text("You are an admin");
});

app.get("/api/admin/users", async (c) => {
	const res = await db.select().from(user_profiles);
	return c.json(res);
});

app.get("/api/admin/users/:id", async (c) => {
	const { id } = c.req.param();
	const [res] = await db.select().from(user_profiles).where(eq(user_profiles.id, id)).limit(1);

	return c.json(res);
});

app.get("/api/", (c) => c.json({ name: "Testing" }));

app.get("/api/session", (c) => {
	const session = c.get("session");
	const user = c.get("user");

	if (!user) return c.body("Unauthorized", 401);

	return c.json({
		session,
		user,
	});
});

app.post("/api/admin/link/accept/:id", async (c) => {
	const { id } = c.req.param();
	const [res] = await db.select().from(link_requests).where(eq(link_requests.user, id));
	await db.delete(link_requests).where(eq(link_requests.user, id));
	await db
		.update(user_profiles)
		.set({
			awaiting_link_request: 0,
			uuid: res.uuid,
		})
		.where(eq(user_profiles.id, id));
	return c.body(null, 200);
});

app.post("/api/admin/link/deny/:id", async (c) => {
	const { id } = c.req.param();
	await db.delete(link_requests).where(eq(link_requests.user, id));
	await db
		.update(user_profiles)
		.set({
			awaiting_link_request: 0,
		})
		.where(eq(user_profiles.id, id));
	return c.body(null, 200);
});

app.get("/api/admin/link/list", async (c) => {
	const result: LinkRequestList = [];
	const raw = await db.select().from(link_requests);
	for (let i = 0; i < raw.length; i++) {
		const element = raw[i];
		const [_user] = await db
			.select()
			.from(user)
			.where(eq(user.id, element.user ?? ""))
			.limit(1);
		const [profile] = await db
			.select()
			.from(user_profiles)
			.where(eq(user_profiles.id, element.user ?? ""))
			.limit(1);

		const info = await fetch("https://mcprofile.io/api/v1/java/uuid/" + element.uuid);

		if (!info.ok) {
			return c.text("mcprofile error", 500);
		}

		const data: MCProfileResponse = await (info.json() as Promise<MCProfileResponse>);

		result.push({
			user: {
				user: _user,
				profile: profile,
			},
			target: {
				uuid: data.uuid,
				username: data.username,
			},
		});
	}
	return c.json(result);
});

app.post("/api/link/request/:uuid", async (c) => {
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

app.get("/api/profile", async (c) => {
	const user = c.get("user");

	if (!user) return c.body("Unauthorized", 401);

	const [res] = await db
		.select()
		.from(user_profiles)
		.where(eq(user_profiles.id, user.id))
		.limit(1);
	const v: UserProfile = res;
	if (res == undefined) {
		const value = {
			id: user.id,
		};
		await db.insert(user_profiles).values(value);
		return c.json(value);
	}

	if (v.uuid != null) {
		const info = await fetch("https://mcprofile.io/api/v1/java/uuid/" + v.uuid);

		if (!info.ok) {
			return c.text("mcprofile error", 500);
		}

		const data: MCProfileResponse = await (info.json() as Promise<MCProfileResponse>);
		v.username = data.username;
	}

	return c.json(res);
});

export default app;
