import type {
	LinkRequestList,
	Match,
	OptionalPlayerInformation,
	OptionalUserInformation,
	WorkerApp,
} from "@/worker/types";
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
		return res.json();
	},
};

export const playersQuery = createQuery<{
	players: OptionalPlayerInformation[];
	matches: Match[] | null;
}>({
	queryKey: ["players"],
	staleTime: 60 * 1000,
	queryFn: async () => {
		const matchesres = await api_client.api.matches.$get();
		if (!matchesres.ok)
			return {
				players: [],
				matches: null,
			};
		const rawmatches = await matchesres.json();

		rawmatches.forEach((match) => {
			let red_scores = 0;
			match.red_players.forEach((p) => (red_scores += p.scores));
			let blue_scores = 0;
			match.blue_players.forEach((p) => (blue_scores += p.scores));

			const updated: Match = {
				...match,
				red_scores: red_scores,
				blue_scores: blue_scores,
			};
			match = updated;
		});
		rawmatches.sort((a, b) => a.uploaded_at - b.uploaded_at);

		const res = await api_client.api.player.list.$get();
		if (!res.ok)
			return {
				players: [],
				matches: null,
			};
		const data: OptionalPlayerInformation[] = await res.json();

		for (const player of data) {
			if (player.exists)
				for (const match of rawmatches) {
					const perf = [...match.blue_players, ...match.red_players].find(
						(p) => p.user == player.id,
					);
					if (perf != undefined) player.performances.push(perf);
				}
		}

		return { players: data, matches: rawmatches };
	},
});

export const adminLinkRequestsQuery = {
	queryKey: ["adminLinkRequests"],
	staleTime: 60 * 1000,
	queryFn: async () => {
		const res = await api_client.api.admin.link.list.$get();

		if (!res.ok) return [];

		return (await res.json()) as LinkRequestList;
	},
};
