import { LinkRequestList, UserInformation } from "@/worker/types";
import { createAuthClient } from "better-auth/react";

export type AuthInformation =
	| {
			isLoggedIn: true;
			user: UserInformation;
	  }
	| {
			isLoggedIn: false;
	  };

export const authQuery = {
	queryKey: ["auth"],
	queryFn: async (): Promise<AuthInformation> => {
		const res = await fetch("/api/auth", {
			credentials: "include",
		});

		if (!res.ok)
			return {
				isLoggedIn: false,
			};
		const user_info = await (res.json() as Promise<UserInformation>);

		const result: AuthInformation = {
			user: user_info,
			isLoggedIn: true,
		};

		return result;
	},
};

export const adminUsersQuery = {
	queryKey: ["adminUsers"],
	queryFn: async () => {
		const res = await fetch("/api/admin/users", {
			credentials: "include",
		});

		if (!res.ok) return null;
		return res.json() as Promise<UserInformation[]>;
	},
};

export const betterAuthQuery = {
	queryKey: ["betterAuth"],
	queryFn: async () => {
		const auth = createAuthClient({
			baseURL: import.meta.env.PROD
				? "https://bridge-stat.timothyrmarriott.workers.dev"
				: "http://localhost:5173",
		});

		return auth;
	},
};

export const adminLinkRequestsQuery = {
	queryKey: ["adminLinkRequests"],
	queryFn: async () => {
		const res = await fetch("/api/admin/link/list", {
			credentials: "include",
		});

		if (!res.ok) return null;
		return res.json() as Promise<LinkRequestList>;
	},
};
