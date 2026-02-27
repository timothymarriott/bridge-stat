import { Hono, TypedResponse } from "hono";
import { better_auth } from "../auth";
import { RequireAdmin } from "../../utils";
import { GetPlayerInformationByUser, GetUsers } from "../../requests";
import link from "./link";
import {
	FullMatchInsertData,
	MatchInsertData,
	PlayerPerformanceInsertData,
	UserInformation,
} from "../../types";
import { RequireAuthInformation } from "../..";
import { db } from "../../database";
import { matches, user_performances } from "../../schema";

export const admin = new Hono<{
	Variables: {
		user: typeof better_auth.$Infer.Session.user | null;
		session: typeof better_auth.$Infer.Session.session | null;
	};
}>()
	.use("*", RequireAuthInformation)
	.use("*", RequireAdmin)
	.route("/link", link)
	.post<"/upload", {}, TypedResponse<void>>("/upload", async (c) => {
		const data: FullMatchInsertData = await c.req.json<FullMatchInsertData>();

		const users = await GetUsers();

		const players = await Promise.all(users.map((usr) => GetPlayerInformationByUser(usr)));

		const match_data: MatchInsertData = {
			...data,
		};

		const [match] = await db.insert(matches).values(match_data).returning();

		for (const info of data.red_players) {
			const player = players.find((p) => p.exists && p.username == info.username);
			if (player && player.exists) {
				const perf_data: PlayerPerformanceInsertData = {
					match: match.id,
					user: player.id,
					team: info.team,
					kills: info.kills,
					deaths: info.deaths,
					voids: info.voids,
					scores: info.scores,
				};
				await db.insert(user_performances).values(perf_data);
			}
		}
	})
	.get<"/users", {}, TypedResponse<UserInformation[]>>("/users", async (c) => {
		return c.json<UserInformation[]>(await GetUsers());
	});

export default admin;
