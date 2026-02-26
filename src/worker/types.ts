import type { InferInsertModel, InferSelectModel } from "drizzle-orm";
import { link_requests, matches, user, user_performances, user_profiles } from "./schema";
import app from "./index";

export type User = InferSelectModel<typeof user>;
export type UserProfile = InferSelectModel<typeof user_profiles>;
export type PlayerPerformance = InferSelectModel<typeof user_performances>;
export type LinkRequest = InferSelectModel<typeof link_requests>;
export type MatchInsertData = InferInsertModel<typeof matches>;
export type Match = InferSelectModel<typeof matches> & {
	red_players: string[];
	blue_players: string[];
};
export type PlayerPerformanceInsertData = InferInsertModel<typeof user_performances>;

export type UserInformation = UserProfile & User;

export type PlayerInformation = UserProfile &
	User & {
		performances: PlayerPerformance[];
		uuid: string;
	};

export type LinkRequestInfo = {
	user: UserInformation;
	target: {
		uuid: string;
		username: string;
	};
};

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

export type MatchSumbitdata = {
	winner: Team;
	red_scores: number;
	blue_scores: number;
	duration: number;
	red_players: string[];
	blue_players: string[];
};

export enum Team {
	BLUE = 0,
	RED = 1,
}

export type WorkerApp = typeof app;
