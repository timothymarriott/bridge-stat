import { Match, Team } from "@/worker/types";

export function CalculateZScore(x: number, stats: number[]) {
	let mean = 0;
	stats.forEach((v) => (mean += v));
	mean /= stats.length;

	let variance = 0;
	for (const v of stats) {
		const diff = v - mean;
		variance += diff * diff;
	}
	variance /= stats.length;

	const sigma = Math.sqrt(variance);

	const EPSILON = 0.5;
	return (x - mean) / (sigma + EPSILON);
}

export function CalculateMatchScores(
	target: string,
	match: Match,
): {
	kills: number;
	deaths: number;
	voids: number;
	scores: number;
} {
	const targ = [...match.red_players, ...match.blue_players].find((x) => x.user == target);
	if (!targ) {
		throw new Error("Invalid target for score calculation.");
	}

	const kills = (targ.team == Team.RED ? match.red_players : match.blue_players).map(
		(p) => p.kills,
	);
	const deaths = (targ.team == Team.RED ? match.red_players : match.blue_players).map(
		(p) => p.deaths,
	);
	const voids = (targ.team == Team.RED ? match.red_players : match.blue_players).map(
		(p) => p.voids,
	);
	const scores = (targ.team == Team.RED ? match.red_players : match.blue_players).map(
		(p) => p.scores,
	);

	return {
		kills: CalculateZScore(targ.kills, kills),
		deaths: CalculateZScore(targ.deaths, deaths),
		voids: CalculateZScore(targ.voids, voids),
		scores: CalculateZScore(targ.scores, scores),
	};
}

export function CalculateMatchImpact(target: string, match: Match): number {
	const scores = CalculateMatchScores(target, match);
	return Math.tanh(1.3 * scores.scores + 1.1 * scores.kills - 1 * scores.deaths);
}

export function CalculateMatchRawShare(target: string, match: Match): number {
	const targ = [...match.red_players, ...match.blue_players].find((x) => x.user == target);
	if (!targ) {
		throw new Error("Invalid target for score calculation.");
	}
	const teamPlayers = targ.team == Team.RED ? match.red_players : match.blue_players;

	const impacts = teamPlayers.map((p) => CalculateMatchImpact(p.user ?? "", match));

	const rawShares = impacts.map((impact) => Math.exp(impact));

	const rawShareTeam = rawShares.reduce((a, b) => a + b, 0);

	const targetIndex = teamPlayers.findIndex((p) => p.user === target);
	if (targetIndex === -1) throw new Error("Target player not found in match.");

	let W_i = rawShares[targetIndex] / rawShareTeam;

	const alpha = 0.4;
	const teamSize = teamPlayers.length;
	W_i = alpha * (1 / teamSize) + (1 - alpha) * W_i;

	W_i = Math.min(Math.max(W_i, 0.6 / teamSize), 1.4 / teamSize);

	return W_i;
}

export function CalculateEloDelta(
	target: string,
	currentElos: Record<string, number>,
	match: Match,
	K = 30,
): number {
	const targ = [...match.red_players, ...match.blue_players].find((x) => x.user == target);
	if (!targ) {
		throw new Error("Invalid target for score calculation.");
	}
	let winner: Team = Team.RED;

	if (match.red_scores == 5) {
		winner = Team.RED;
	} else if (match.blue_scores == 5) {
		winner = Team.BLUE;
	}

	const rating_blue =
		match.blue_players.reduce((sum, p) => sum + (currentElos[p.id] ?? 1000), 0) /
		match.blue_players.length;
	const rating_red =
		match.red_players.reduce((sum, p) => sum + (currentElos[p.id] ?? 1000), 0) /
		match.red_players.length;

	const ratingTeam = targ.team == Team.RED ? rating_red : rating_blue;
	const ratingOpponent = targ.team == Team.RED ? rating_blue : rating_red;

	const expected = 1 / (1 + 10 ** ((ratingOpponent - ratingTeam) / 400));

	const S = targ.team === winner ? 1 : 0;

	const teamDelta = K * (S - expected);

	const playerShare = CalculateMatchRawShare(target, match);

	const delta = teamDelta * playerShare;

	return delta;
}

export function CalculateElos(matches: Match[]): Record<string, number> {
	let elos: Record<string, number> = {};

	matches.forEach((match) => {
		[...match.red_players, ...match.blue_players].forEach((p) => {
			if (p.user) elos[p.user] = 1000;
		});
	});

	matches.forEach((match) => {
		[...match.red_players, ...match.blue_players].forEach((p) => {
			if (p.user) {
				const delta = CalculateEloDelta(p.user, elos, match);
				elos[p.user] += delta;
			}
		});
	});

	return elos;
}
