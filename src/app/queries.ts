import { LinkRequest, LinkRequestList, UserProfile } from "@/worker/types";
import { createAuthClient } from "better-auth/react";

export const profileQuery = {
	queryKey: ["profile"],
	queryFn: async () => {
		const res = await fetch("/api/profile", {
			credentials: "include",
		});

		if (!res.ok) return null;
		return res.json() as Promise<UserProfile>;
	},
};

export const adminUsersQuery = {
	queryKey: ["adminUsers"],
	queryFn: async () => {
		const res = await fetch("/api/admin/users", {
			credentials: "include",
		});

		if (!res.ok) return null;
		return res.json() as Promise<UserProfile[]>;
	},
};

export const authQuery = {
	queryKey: ["auth"],
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
