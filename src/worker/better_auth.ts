import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { admin } from "better-auth/plugins";
import { db } from "./database";
import * as schema from "./schema";
import { env } from "cloudflare:workers";

import { config } from "dotenv";

config({
	path: ".dev.vars",
});

export const better_auth = betterAuth({
	database: drizzleAdapter(db, {
		provider: "sqlite",
		schema: {
			...schema,
		},
	}),
	session: {},
	plugins: [admin()],
	socialProviders: {
		discord: {
			clientId: env.DISCORD_CLIENT_ID,
			clientSecret: env.DISCORD_CLIENT_SECRET,
		},
		google: {
			clientId: env.GOOGLE_CLIENT_ID,
			clientSecret: env.GOOGLE_CLIENT_SECRET,
		},
	},
	user: {
		deleteUser: {
			enabled: true,
		},
	},
});
