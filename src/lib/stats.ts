import { Match, OptionalPlayerInformation } from "@/worker/types";
import { rate, Rating } from "ts-trueskill";

export type MatchEloInformation = {
	match: Match;
	deltas: Record<string, number>;
	totals: Record<string, Rating>;
};

export type EloInformation = {
	finalScores: Record<string, Rating>;
	matches: Record<string, MatchEloInformation>;
};

export function GetELO(score: Rating) {
	return score.mu * 100 - 1000;
}

export function CalculateElos(
	players: OptionalPlayerInformation[],
	matches: Match[],
): EloInformation {
	const ratings: Record<string, Rating> = {};

	for (const p of players) {
		if (p.exists) ratings[p.id] = new Rating();
	}

	const deltas: Record<string, MatchEloInformation> = {};

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

		if (match.red_scores > match.blue_scores) {
			ranks = [0, 1];
		} else if (match.blue_scores > match.red_scores) {
			ranks = [1, 0];
		} else {
			ranks = [0, 0];
		}

		const [newRed, newBlue] = rate([redTeam, blueTeam], ranks);

		deltas[match.id] = {
			match: match,
			deltas: {},
			totals: {},
		};

		match.red_players.forEach((p, i) => {
			const old = ratings[p.user ?? ""];
			if (old == undefined) return;
			deltas[match.id].deltas[p.user!] = GetELO(newRed[i]) - GetELO(old);
			deltas[match.id].totals[p.user!] = newRed[i];
			ratings[p.user!] = newRed[i];
		});

		match.blue_players.forEach((p, i) => {
			const old = ratings[p.user ?? ""];
			if (old == undefined) return;
			deltas[match.id].deltas[p.user!] = GetELO(newBlue[i]) - GetELO(old);
			deltas[match.id].totals[p.user!] = newBlue[i];
			ratings[p.user!] = newBlue[i];
		});
	}

	return {
		finalScores: ratings,
		matches: deltas,
	};
}
