import { Hono, TypedResponse } from "hono";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { CreateUserProfile, GetUserProfileById, UpdateProfileUsername } from "../requests";
import { env } from "cloudflare:workers";
import * as schema from "../schema";
import { OptionalUserInformation, User } from "../types";
import { FetchMojangProfile } from "../mojang";
import { db } from "../database";
import { RequireAuthInformation } from "..";

export const better_auth = betterAuth({
	database: drizzleAdapter(db, {
		provider: "sqlite",
		schema: {
			...schema,
		},
	}),
	session: {},
	plugins: [],
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
});

export const auth = new Hono<{
	Variables: {
		user: User | null;
		session: typeof better_auth.$Infer.Session.session | null;
	};
}>()
	.use("*", RequireAuthInformation)

	.get<"/", {}, TypedResponse<OptionalUserInformation>>("/", async (c) => {
		const user = c.get("user");

		if (!user)
			return c.json<OptionalUserInformation>(
				{
					exists: false,
				},
				200,
			);

		let res = await GetUserProfileById(user.id);
		if (res == undefined) {
			res = await CreateUserProfile(user.id);
		}

		if (res.uuid != null && res.username == null) {
			console.log("Fetching username " + new Date().toISOString());
			const data = await FetchMojangProfile(res.uuid);
			res.username = data.username;
			await UpdateProfileUsername(user.id, res.username);
		}
		console.log("done " + new Date().toISOString());

		const result: OptionalUserInformation = {
			...res,
			...user,
			exists: true,
		};

		return c.json<OptionalUserInformation>(result);
	})
	.on(["POST", "GET"], "/*", (c) => {
		return better_auth.handler(c.req.raw);
	});

export default auth;
