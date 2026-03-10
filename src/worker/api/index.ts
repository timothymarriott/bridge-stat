import { Hono, TypedResponse } from "hono";
import admin from "./admin";
import { cors } from "hono/cors";
import { env } from "cloudflare:workers";
import { auth } from "./auth";
import { FetchMojangProfile, FetchMojangProfileFromName } from "../mojang";
import player from "./player";
import {
	AddLinkRequest,
	GetMatches,
	GetPlayerInformationByUser,
	GetUserProfileById,
	GetUsers,
} from "../requests";
import { Match, MatchInsertData, MCProfileInfo, PlayerPerformanceInsertData, Team } from "../types";
import { db } from "../database";
import { matches, user_performances } from "../schema";
import { MAP_NAMES } from "../../lib/data";
import { RequireAuthInformation } from "..";
import { better_auth } from "../better_auth";

export const api = new Hono<{
	Variables: {
		user: typeof better_auth.$Infer.Session.user | null;
		session: typeof better_auth.$Infer.Session.session | null;
	};
}>()
	.get("/", (c) => c.json({}))
	.route("/admin", admin)
	.use("/link/request/*", RequireAuthInformation)
	.post("/link/request/:uuid", async (c) => {
		const { uuid } = c.req.param();
		const user = c.get("user");

		if (!user) return c.body(null, 401);

		const res = await GetUserProfileById(user.id);

		if (res!.awaiting_link_request > 0) {
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
	.get<"/profile/uuid/:uuid", {}, TypedResponse<MCProfileInfo | null>>(
		"/profile/uuid/:uuid",
		async (c) => {
			const { uuid } = c.req.param();
			return c.json<MCProfileInfo>(await FetchMojangProfile(uuid));
		},
	)
	.get<"/profile/name/:name", {}, TypedResponse<MCProfileInfo | null>>(
		"/profile/name/:name",
		async (c) => {
			const { name } = c.req.param();

			return c.json<MCProfileInfo>(await FetchMojangProfileFromName(name));
		},
	)
	.get<"/matches", {}, TypedResponse<Record<string, Match>>>("/matches", async (c) => {
		const matches = await GetMatches();

		return c.json(matches);
	})
	.get("/seed", async (c) => {
		const users = await GetUsers();

		const all_players = await Promise.all(users.map((usr) => GetPlayerInformationByUser(usr)));

		const performances: PlayerPerformanceInsertData[] = [];
		const new_matches: MatchInsertData[] = [];

		const keys: number[] = [];

		for (let i = 0; i < 20; i++) {
			keys.push(i);
		}

		await Promise.all(
			keys.map(async (_) => {
				const players = all_players.toSorted(() => {
					if (Math.random() >= 0.5) {
						return 1;
					} else {
						return -1;
					}
				});

				const winner = Math.random() >= 0.5 ? Team.RED : Team.BLUE;

				console.log(winner);

				const game: MatchInsertData = {
					winner,
					red_scores: winner == Team.RED ? 5 : Math.floor(Math.random() * 4),
					blue_scores: winner == Team.BLUE ? 5 : Math.floor(Math.random() * 4),
					duration: 300 + Math.random() * 600,
					map: MAP_NAMES[Math.floor(Math.random() * MAP_NAMES.length)],
				};

				new_matches.push(game);

				const match_data = await db.insert(matches).values(game).returning();

				const red_players = [players.pop()!, players.pop()!];

				const blue_players = [players.pop()!, players.pop()!];

				let remaining_red_scores = game.red_scores ?? 0;

				for (const player of red_players) {
					if (!player.exists) continue;
					const scores = Math.floor(Math.random() * remaining_red_scores);
					remaining_red_scores -= scores;
					const data: PlayerPerformanceInsertData = {
						match: match_data[0].id,
						user: player.id,
						team: Team.RED,
						kills: Math.floor(Math.random() * 20),
						deaths: Math.floor(Math.random() * 20),
						voids: Math.floor(Math.random() * 10),
						scores: scores,
					};
					performances.push(data);
					await db.insert(user_performances).values(data);
				}

				let remaining_blue_scores = game.blue_scores ?? 0;

				for (const player of blue_players) {
					if (!player.exists) continue;
					const scores = Math.floor(Math.random() * remaining_blue_scores);
					remaining_blue_scores -= scores;
					const data: PlayerPerformanceInsertData = {
						match: match_data[0].id,
						user: player.id,
						team: Team.BLUE,
						kills: Math.floor(Math.random() * 20),
						deaths: Math.floor(Math.random() * 20),
						voids: Math.floor(Math.random() * 10),
						scores: scores,
					};
					performances.push(data);
					await db.insert(user_performances).values(data);
				}
			}),
		);

		return c.json(
			{
				matches: new_matches,
				performances: performances,
			},
			200,
		);
	})
	.route("/player", player)
	.route("/auth", auth);

export default api;
