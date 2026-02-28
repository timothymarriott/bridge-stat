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
import { eq } from "drizzle-orm";

export const admin = new Hono<{
	Variables: {
		user: typeof better_auth.$Infer.Session.user | null;
		session: typeof better_auth.$Infer.Session.session | null;
	};
}>()
	.use("*", RequireAuthInformation)
	.use("*", RequireAdmin)
	.route("/link", link)
	.post<"/upload">("/upload", async (c) => {
		const text = await c.req.text();
		const data: FullMatchInsertData = await JSON.parse(text);

		const users = await GetUsers();

		const players = await Promise.all(users.map((usr) => GetPlayerInformationByUser(usr)));

		const match_data: MatchInsertData = {
			...data,
		};
		const [match] = await db.insert(matches).values(match_data).returning();

		const perfs: PlayerPerformanceInsertData[] = [];

		for (const info of [...data.red_players, ...data.blue_players]) {
			const player = players.find((p) => p.exists && p.username == info.username);
			if (player && player.exists) {
				perfs.push({
					match: match.id,
					user: player.id,
					team: info.team,
					kills: info.kills,
					deaths: info.deaths,
					voids: info.voids,
					scores: info.scores,
				});
			} else {
				await db.delete(matches).where(eq(matches.id, match.id));
				return c.text("User " + info.username + " not found.", 404);
			}
		}

		for (const perf of perfs) {
			await db.insert(user_performances).values(perf);
		}

		return c.body(null, 200);
	})
	.get<"/users", {}, TypedResponse<UserInformation[]>>("/users", async (c) => {
		return c.json<UserInformation[]>(await GetUsers());
	});

export default admin;
