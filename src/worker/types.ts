import type { InferSelectModel } from "drizzle-orm";
import { link_requests, user_profiles } from "./schema";
import { User } from "better-auth";

export type UserProfile = InferSelectModel<typeof user_profiles> & { username?: string };
export type LinkRequest = InferSelectModel<typeof link_requests>;

export type UserInformation = {
	profile: UserProfile;
	user: User;
};

export type LinkRequestInfo = {
	user: UserInformation;
	target: {
		uuid: string;
		username: string;
	};
};

export type AdminUserList = Record<string, UserInformation>;

export type LinkRequestList = LinkRequestInfo[];

export interface MCProfileResponse {
	username: string;
	uuid: string;
	skin: string;
	cape: string;
	linked: boolean;
}
