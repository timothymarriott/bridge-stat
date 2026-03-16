import { GetELO, MatchEloInformation } from "@/lib/stats";
import {
	Match,
	OptionalPlayerInformation,
	PlayerInformation,
	PlayerPerformance,
	Team,
} from "@/worker/types";
import { TeamInfoComponent } from "./player-performances-list";
import { Separator } from "@/components/ui/separator";

export function MatchInfo({
	perf,
	match,
	eloInfo,
	players,
	player,
}: {
	perf: PlayerPerformance;
	match: Match;
	eloInfo: MatchEloInformation;
	players: OptionalPlayerInformation[];
	player: PlayerInformation;
}) {
	const didWin =
		perf.team == Team.RED
			? match.red_scores > match.blue_scores
			: match.blue_scores > match.red_scores;

	return (
		<div className="flex flex-row select-none">
			<div className="w-64 space-y-1">
				<div className="flex flex-row justify-between">
					{didWin ? (
						<span className="text-green-400">Won</span>
					) : (
						<span className="text-red-400">Lost</span>
					)}
					<span className="text-accent-foreground/50">{match.map}</span>
					<div className="flex flex-row">
						<span className="font-bold">
							{Math.floor(match.duration / 60).toString()}
						</span>
						<span className="text-accent-foreground/50 font-bold">:</span>
						<span className="font-bold">
							{Math.floor(match.duration - Math.floor(match.duration / 60) * 60)
								.toString()
								.padStart(2, "0")}
						</span>
					</div>
				</div>
				<div className="justify-between grid grid-cols-[auto_1fr_auto] rounded-sm items-center">
					{perf.team == Team.RED ? (
						<TeamInfoComponent
							match={match}
							players={players}
							team={Team.RED}
							side="left"
						/>
					) : (
						<TeamInfoComponent
							match={match}
							players={players}
							team={Team.BLUE}
							side="left"
						/>
					)}
					<span className="text-center">vs</span>
					{perf.team == Team.RED ? (
						<TeamInfoComponent
							match={match}
							players={players}
							team={Team.BLUE}
							side="right"
						/>
					) : (
						<TeamInfoComponent
							match={match}
							players={players}
							team={Team.RED}
							side="right"
						/>
					)}
				</div>
			</div>
			<Separator orientation="vertical" className="mx-2"></Separator>
			<div className="flex-1">
				<div className="space-x-1">
					<span className="text-lg font-bold">
						{Math.floor(GetELO(eloInfo.totals[player.id]))}
					</span>
					<span
						className={
							"font-bold " +
							(Math.floor(eloInfo.deltas[player.id]) > 0
								? "text-green-400"
								: "text-red-400")
						}
					>
						{Math.floor(eloInfo.deltas[player.id]) > 0 ? "+" : "-"}
						{Math.abs(Math.floor(eloInfo.deltas[player.id]))}
					</span>
				</div>
				<span>
					<span className="font-bold">
						{Math.round(eloInfo.totals[player.id].pi * 100)}
					</span>
					<span className="text-accent-foreground/50">% Confident</span>
				</span>
			</div>
		</div>
	);
}
