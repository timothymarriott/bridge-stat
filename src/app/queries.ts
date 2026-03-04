import type {
	Match,
	OptionalPlayerInformation,
	OptionalUserInformation,
	UserInformation,
	WorkerApp,
} from "@/worker/types";
import { createAuthClient } from "better-auth/react";
import { hc } from "hono/client";
import { createQuery } from "./auth-hooks";

export const api_client = hc<WorkerApp>(
	import.meta.env.PROD
		? "https://bridge-stat.timothyrmarriott.workers.dev"
		: "http://localhost:5173",
	{},
);

export const authQuery = createQuery({
	queryKey: ["auth"],
	staleTime: 30 * 1000,
	queryFn: async (): Promise<OptionalUserInformation> => {
		const res = await api_client.api.auth.$get();

		if (!res.ok)
			return {
				exists: false,
			};
		const user_info = await res.json();

		if (user_info.exists) {
			return {
				...user_info,
			};
		}
		return user_info;
	},
});

export const adminUsersQuery = {
	queryKey: ["adminUsers"],
	staleTime: 60 * 1000,
	queryFn: async () => {
		const res = await api_client.api.admin.users.$get();

		if (!res.ok) return null;
		return res.json() as Promise<UserInformation[]>;
	},
};

export const playersQuery = {
	queryKey: ["players"],
	staleTime: 60 * 1000,
	queryFn: async () => {
		const res = await api_client.api.player.list.$get();
		if (!res.ok) return [];
		const data: OptionalPlayerInformation[] = await res.json();

		return data;
	},
};

export const matchesQuery = createQuery({
	queryKey: ["matches"],
	staleTime: 60 * 1000,
	queryFn: async () => {
		const res = await api_client.api.matches.$get();
		if (!res.ok) return {};
		const data = await res.json();

		Object.keys(data).forEach((k) => {
			let red_scores = 0;
			data[k].red_players.forEach((p) => (red_scores += p.scores));
			let blue_scores = 0;
			data[k].blue_players.forEach((p) => (blue_scores += p.scores));

			const updated: Match = {
				...data[k],
				red_scores: red_scores,
				blue_scores: blue_scores,
			};
			data[k] = updated;
		});

		return data;
	},
});

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
	staleTime: 60 * 1000,
	queryFn: async () => {
		const res = await api_client.api.admin.link.list.$get();

		if (!res.ok) return [];

		return res.json();
	},
};
