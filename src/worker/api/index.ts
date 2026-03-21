import { Hono, TypedResponse } from "hono";
import admin from "./admin";
import { cors } from "hono/cors";
import { env } from "cloudflare:workers";
import { auth } from "./auth";
import { FetchMojangProfile, FetchMojangProfileFromName } from "../mojang";
import player from "./player";
import { AddLinkRequest, GetMatches, GetUserProfileById } from "../requests";
import { Match, MCProfileInfo } from "../types";
import { RequireAuthInformation } from "..";
import { better_auth } from "../better_auth";
import upload from "./upload";

export const api = new Hono<{
	Variables: {
		user: typeof better_auth.$Infer.Session.user | null;
		session: typeof better_auth.$Infer.Session.session | null;
	};
}>()
	.use("*", async (c, next) => {
		try {
			await next();
		} catch (err) {
			console.error(err);
			return c.json({
				error: err,
				status: 500,
			});
		}
	})
	.get("/", (c) => c.json({}))
	.route("/admin", admin)
	.use("/link/request/*", RequireAuthInformation)
	.post("/link/request/:uuid", async (c) => {
		const { uuid } = c.req.param();
		const user = c.get("user");

		if (!user) return c.body(null, 401);

		const res = await GetUserProfileById(user.id);

		if (!res) {
			return c.body(null, 404);
		}

		if (res.awaiting_link_request > 0) {
			return c.body(null, 401);
		}

		await AddLinkRequest(user.id, uuid);

		return c.body(null, 200);
	})
	.use(
		"/auth/*",
		cors({
			origin: env.BETTER_AUTH_URL,
			allowHeaders: ["Content-Type", "Authorization"],
			allowMethods: ["POST", "GET", "OPTIONS"],
			exposeHeaders: ["Content-Length"],
			maxAge: 600,
			credentials: true,
		}),
	)
	.route("/upload", upload)
	.get<"/profile/uuid/:uuid", object, TypedResponse<MCProfileInfo | null>>(
		"/profile/uuid/:uuid",
		async (c) => {
			const { uuid } = c.req.param();
			return c.json<MCProfileInfo>(await FetchMojangProfile(uuid));
		},
	)
	.get<"/profile/name/:name", object, TypedResponse<MCProfileInfo | null>>(
		"/profile/name/:name",
		async (c) => {
			const { name } = c.req.param();

			return c.json<MCProfileInfo>(await FetchMojangProfileFromName(name));
		},
	)
	.get<"/matches", object, TypedResponse<Match[]>>("/matches", async (c) => {
		const matches = await GetMatches();

		return c.json(matches);
	})
	.get<"/unverified", object, TypedResponse<Match[]>>("/unverified", async (c) => {
		const matches = await GetMatches(false);
		return c.json(matches);
	})
	.route("/player", player)
	.route("/auth", auth);

export default api;
