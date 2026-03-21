import type { InferInsertModel, InferSelectModel } from "drizzle-orm";
import { link_requests, matches, user, user_performances, user_profiles } from "./schema";
import app from "./index";

export type User = InferSelectModel<typeof user>;
export type UserProfile = InferSelectModel<typeof user_profiles>;
export type PlayerPerformance = InferSelectModel<typeof user_performances>;
export type LinkRequest = InferSelectModel<typeof link_requests>;
export type MatchInsertData = Omit<InferInsertModel<typeof matches>, "verified">;
export type Match = InferSelectModel<typeof matches> & {
	red_players: PlayerPerformance[];
	blue_players: PlayerPerformance[];
	red_scores: number;
	blue_scores: number;
};

export enum SortMode {
	NewToOld = "new_to_old",
	OldToNew = "old_to_new",
}

export interface MatchPlayerInsertData {
	username: string;
	team: Team;
	deaths: number;
	scores: number;
	kills: number;
	voids: number;
}
export interface FullMatchInsertData {
	date: number;
	duration: number;
	map: string;
	red_players: MatchPlayerInsertData[];
	blue_players: MatchPlayerInsertData[];
}

export async function GenerateMatchHash(data: FullMatchInsertData): Promise<string> {
	let hash_number = data.duration;

	[...data.red_players, ...data.blue_players].forEach((p) => {
		hash_number ^= p.scores;
		hash_number ^= p.kills;
		hash_number ^= p.deaths;
	});

	const hash_data = {
		duration: data.duration,
		map: data.map,
		hash: data.duration ^ hash_number,
	};

	const encoder = new TextEncoder();
	const hash = await crypto.subtle.digest("SHA-256", encoder.encode(JSON.stringify(hash_data)));
	const hashArray = Array.from(new Uint8Array(hash));
	const hashhex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
	return hashhex;
}

export async function GetMatchPreview(
	insertData: FullMatchInsertData,
	players: PlayerInformation[],
): Promise<Match> {
	const result: Match = {
		duration: insertData.duration,
		id: Math.random() * 10000,
		hash: await GenerateMatchHash(insertData),
		map: insertData.map,
		uploaded_at: insertData.date,
		verified: 1,
		red_players: [],
		blue_players: [],
		red_scores: 0,
		blue_scores: 0,
	};

	insertData.blue_players.forEach((p, i) => {
		const player = players.find((_p) => _p.username == p.username);
		if (!player) return;
		result.blue_scores += p.scores;
		result.blue_players.push({
			user: player.id,
			id: result.id - i,
			match: result.id,
			team: Team.BLUE,
			kills: p.kills,
			deaths: p.deaths,
			voids: p.voids,
			scores: p.scores,
		});
	});

	insertData.red_players.forEach((p, i) => {
		const player = players.find((_p) => _p.username == p.username);
		if (!player) return;
		result.red_scores += p.scores;
		result.red_players.push({
			user: player.id,
			id: result.id + i,
			match: result.id,
			team: Team.RED,
			kills: p.kills,
			deaths: p.deaths,
			voids: p.voids,
			scores: p.scores,
		});
	});

	return result;
}

export type PlayerPerformanceInsertData = InferInsertModel<typeof user_performances>;

export type UserInformation = UserProfile & User;

export type PlayerInformation = UserProfile &
	User & {
		performances: PlayerPerformance[];
		uuid: string;
	};

export interface LinkRequestInfo {
	user: UserInformation;
	target: {
		uuid: string;
		username: string;
	};
}

export type UserList = Record<string, UserInformation>;

export type LinkRequestList = LinkRequestInfo[];

export type OptionalUserInformation =
	| ({
			exists: true;
	  } & UserInformation)
	| {
			exists: false;
	  };

export type OptionalPlayerInformation =
	| ({
			exists: true;
	  } & PlayerInformation)
	| {
			exists: false;
	  };

export interface MCProfileInfo {
	username: string;
	uuid: string;
	cache: "HIT" | "MISS";
}

export enum Team {
	BLUE = 0,
	RED = 1,
}

export type WorkerApp = typeof app;

export interface MatchUploadMessage {
	id: number;
	match: FullMatchInsertData;
}

export type MatchUploadResponse = {
	id: number;
} & (
	| {
			success: false;
			error: string;
	  }
	| {
			success: true;
	  }
);
