import { Match, OptionalPlayerInformation } from "@/worker/types";
import { rate, Rating, quality } from "ts-trueskill";

export function CalculateElos(
	players: OptionalPlayerInformation[],
	matches: Match[],
): Record<string, number> {
	const ratings: Record<string, Rating> = {};

	for (const p of players) {
		if (p.exists) ratings[p.id] = new Rating();
	}

	for (const match of matches) {
		const redTeam = match.red_players.map((p) => ratings[p.user ?? ""]);
		const blueTeam = match.blue_players.map((p) => ratings[p.user ?? ""]);

		let ranks: number[];

		if (match.red_scores === 5) {
			ranks = [0, 1];
		} else if (match.blue_scores === 5) {
			ranks = [1, 0];
		} else {
			ranks = [0, 0];
		}

		const [newRed, newBlue] = rate([redTeam, blueTeam], ranks);

		match.red_players.forEach((p, i) => {
			ratings[p.user ?? ""] = newRed[i];
		});

		match.blue_players.forEach((p, i) => {
			ratings[p.user ?? ""] = newBlue[i];
		});
	}

	const elos: Record<string, number> = {};

	for (const id in ratings) {
		elos[id] = ratings[id].mu * 100 - 1000;
	}

	return elos;
}
