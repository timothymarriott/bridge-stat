import { Match, OptionalPlayerInformation } from "@/worker/types";
import { rate, Rating } from "ts-trueskill";

export type EloInformation = {
	finalScores: Record<string, number>;
	deltas: Record<string, Record<string, number>>;
};

export function CalculateElos(
	players: OptionalPlayerInformation[],
	matches: Match[],
): EloInformation {
	const ratings: Record<string, Rating> = {};

	for (const p of players) {
		if (p.exists) ratings[p.id] = new Rating();
	}

	const deltas: Record<string, Record<string, number>> = {};

	for (const match of matches) {
		let redTeam = match.red_players.map((p) => {
			if (p.user == null) {
				return null;
			}
			const v = ratings[p.user];
			if (v == undefined) {
				return null;
			}
			return v;
		});
		redTeam = redTeam.filter((v) => v != null);
		let blueTeam = match.blue_players.map((p) => {
			if (p.user == null) {
				return null;
			}
			const v = ratings[p.user];
			if (v == undefined) {
				return null;
			}
			return v;
		});

		blueTeam = blueTeam.filter((v) => v != null);

		let ranks: number[];

		if (match.red_scores === 5) {
			ranks = [0, 1];
		} else if (match.blue_scores === 5) {
			ranks = [1, 0];
		} else {
			ranks = [0, 0];
		}

		const [newRed, newBlue] = rate([redTeam, blueTeam], ranks);

		deltas[match.id] = {};

		match.red_players.forEach((p, i) => {
			const old = ratings[p.user ?? ""];
			if (old == undefined) return;
			deltas[match.id][p.user!] = newRed[i].mu * 100 - 1000 - (old.mu * 100 - 1000);
			ratings[p.user!] = newRed[i];
		});

		match.blue_players.forEach((p, i) => {
			const old = ratings[p.user ?? ""];
			if (old == undefined) return;
			deltas[match.id][p.user!] = newBlue[i].mu * 100 - 1000 - (old.mu * 100 - 1000);
			ratings[p.user!] = newBlue[i];
		});
	}

	const elos: Record<string, number> = {};

	for (const id in ratings) {
		elos[id] = ratings[id].mu * 100 - 1000;
	}

	return {
		finalScores: elos,
		deltas: deltas,
	};
}
