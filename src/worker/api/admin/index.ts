import { Hono, TypedResponse } from "hono";
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
import { better_auth } from "../../better_auth";

export const admin = new Hono<{
	Variables: {
		user: typeof better_auth.$Infer.Session.user | null;
		session: typeof better_auth.$Infer.Session.session | null;
	};
}>()
	.use("*", RequireAuthInformation)
	.use("*", RequireAdmin)
	.route("/link", link)
	.post("/delete/:id", async (c) => {
		const { id } = c.req.param();

		return c.text("Ok", 200);
	})
	.post<"/upload">("/upload", async (c) => {
		const text = await c.req.text();
		const data: FullMatchInsertData = await JSON.parse(text);

		const users = await GetUsers();

		const players = await Promise.all(users.map((usr) => GetPlayerInformationByUser(usr)));

		let hash_number = data.duration;

		[...data.red_players, ...data.blue_players].forEach(p => {
			hash_number ^= p.scores;
			hash_number ^= p.kills;
			hash_number ^= p.deaths;
		})

		const hash_data = {
			duration: data.duration,
			map: data.map,
			hash: (data.duration ?? 0) ^ hash_number
		}

		const encoder = new TextEncoder();
		const hash = await crypto.subtle.digest("SHA-256", encoder.encode(JSON.stringify(hash_data)));
		const hashArray = Array.from(new Uint8Array(hash));
  		const hashhex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

		const match_data: MatchInsertData = {
			...data,
			uploaded_at: data.date,
			hash: hashhex
		};

		const existingMatch = await db
			.select()
			.from(matches)
			.where(eq(matches.hash, match_data.hash))
			.limit(1)
			.get();

		if (existingMatch) {
			return c.text("Cannot upload duplicate match.", 409);
		}

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
