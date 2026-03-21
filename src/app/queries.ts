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

export async function FetchMatches() {
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
}

export const playersQuery = createQuery<{
	players: OptionalPlayerInformation[];
	matches: Record<string, Match> | null;
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

		Object.keys(rawmatches).forEach((k) => {
			let red_scores = 0;
			rawmatches[k].red_players.forEach((p) => (red_scores += p.scores));
			let blue_scores = 0;
			rawmatches[k].blue_players.forEach((p) => (blue_scores += p.scores));

			const updated: Match = {
				...rawmatches[k],
				red_scores: red_scores,
				blue_scores: blue_scores,
			};
			rawmatches[k] = updated;
		});
		const raw = Object.values(rawmatches);
		const matches: Record<string, Match> = {};
		raw.sort((a, b) => a.uploaded_at - b.uploaded_at);
		raw.forEach((m) => {
			matches[m.id] = m;
		});
		const res = await api_client.api.player.list.$get();
		if (!res.ok)
			return {
				players: [],
				matches: null,
			};
		const data: OptionalPlayerInformation[] = await res.json();

		for (const player of data) {
			if (player.exists)
				for (const match of Object.values(matches)) {
					const perf = [...match.blue_players, ...match.red_players].find(
						(p) => p.user == player.id,
					);
					if (perf != undefined) player.performances.push(perf);
				}
		}

		return { players: data, matches: matches };
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
