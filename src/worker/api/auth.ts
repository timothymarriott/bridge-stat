import { Hono } from "hono";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "../database";
import { env } from "cloudflare:workers";
import * as schema from "../schema";
import { user_profiles } from "../schema";
import { eq } from "drizzle-orm";
import { UserInformation, UserProfile } from "../types";
import { FetchMojangProfile } from "../mojang";

export const auth = betterAuth({
	database: drizzleAdapter(db, {
		provider: "sqlite",
		schema: {
			...schema,
		},
	}),
	socialProviders: {
		discord: {
			clientId: env.DISCORD_CLIENT_ID,
			clientSecret: env.DISCORD_CLIENT_SECRET,
		},
		github: {
			clientId: env.GITHUB_CLIENT_ID,
			clientSecret: env.GITHUB_CLIENT_SECRET,
		},
		google: {
			clientId: env.GOOGLE_CLIENT_ID,
			clientSecret: env.GOOGLE_CLIENT_SECRET,
		},
	},
});

export const authRoute = new Hono<{
	Bindings: Env;
	Variables: {
		user: typeof auth.$Infer.Session.user | null;
		session: typeof auth.$Infer.Session.session | null;
	};
}>();

authRoute.get("/", async (c) => {
	console.log("Start user fetch " + new Date().toISOString());
	const user = c.get("user");

	if (!user) return c.body("Unauthorized", 401);

	const [res] = await db
		.select()
		.from(user_profiles)
		.where(eq(user_profiles.id, user.id))
		.limit(1);
	console.log("Compelted profile fetch " + new Date().toISOString());
	const v: UserProfile = res;
	if (res == undefined) {
		const value = {
			id: user.id,
		};
		console.log("inserted " + new Date().toISOString());
		await db.insert(user_profiles).values(value);
		return c.json(value);
	}

	if (v.uuid != null && v.username == null) {
		console.log("Fetching username " + new Date().toISOString());
		const data = await FetchMojangProfile(v.uuid);
		v.username = data.username;
		await db
			.update(user_profiles)
			.set({
				username: data.username,
			})
			.where(eq(user_profiles.id, user.id));
	}
	console.log("done " + new Date().toISOString());

	const result: UserInformation = {
		...v,
		...user,
	};

	return c.json(result);
});

authRoute.on(["POST", "GET"], "*", (c) => {
	return auth.handler(c.req.raw);
});
