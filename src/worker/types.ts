import type { InferSelectModel } from "drizzle-orm";
import { link_requests, user_profiles } from "./schema";
import { User } from "better-auth";

export type UserProfile = InferSelectModel<typeof user_profiles>;
export type LinkRequest = InferSelectModel<typeof link_requests>;

export type UserInformation = UserProfile & User;

export type LinkRequestInfo = {
	user: UserInformation;
	target: {
		uuid: string;
		username: string;
	};
};

export type UserList = Record<string, UserInformation>;

export type LinkRequestList = LinkRequestInfo[];

export interface MCProfileInfo {
	username: string;
	uuid: string;
	skin: string;
	cape: string;
	linked: boolean;
	cache: "HIT" | "MISS";
}

export enum Team {
	BLUE = 0,
	RED = 1,
}
