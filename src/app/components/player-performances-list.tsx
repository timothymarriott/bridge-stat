import {
	Match,
	OptionalPlayerInformation,
	PlayerInformation,
	PlayerPerformance,
	Team,
} from "@/worker/types";
import { useQueryData } from "../auth-hooks";
import { matchesQuery, playersQuery } from "../queries";
import MinecraftAvatar from "./mc-avatar";
import {
	Popover,
	PopoverContent,
	PopoverDescription,
	PopoverHeader,
	PopoverTitle,
	PopoverTrigger,
} from "@/components/ui/popover";
import { useIsMobile } from "@/hooks/use-mobile";
import { CalculateElos, EloInformation } from "@/lib/stats";
import { useEffect, useState } from "react";
import { FilterState, SortMode } from "../routes/player/$username";

export default function PlayerPerformancesList({
	player,
	sortMode,
	filterState,
}: {
	player: PlayerInformation;
	sortMode: SortMode;
	filterState: FilterState;
}) {
	const matches = useQueryData(matchesQuery);
	const players = useQueryData(playersQuery, []);

	const [performances, setPerformances] = useState<PlayerPerformance[]>([]);

	const [elos, setElos] = useState<EloInformation | null>(null);

	useEffect(() => {
		if (matches != null) {
			const elo = CalculateElos(players, Object.values(matches));

			setElos(elo);

			setPerformances(
				player.performances
					.filter((a) => {
						if (filterState.filterTeamCount) {
							if (!a.match) return false;
							const match = matches[a.match];
							if (!match) return false;

							const me_count =
								a.team == Team.RED
									? match.red_players.length
									: match.blue_players.length;
							const them_count =
								a.team == Team.RED
									? match.blue_players.length
									: match.red_players.length;

							return (
								me_count == filterState.yourTeamCount &&
								them_count == filterState.theirTeamCount
							);
						}

						return true;
					})
					.sort((a, b) => {
						if (sortMode == SortMode.OldToNew) {
							return a.id - b.id;
						}
						if (sortMode == SortMode.NewToOld) {
							return b.id - a.id;
						}
						return 0;
					}),
			);
		}
	}, [matches, filterState, sortMode]);

	return (
		<>
			<div className="space-y-1">
				{matches != null &&
					elos != null &&
					performances.length > 0 &&
					performances.map((perf, i) => {
						return (
							<PerformanceDisplay
								key={i}
								elos={elos}
								matches={matches}
								i={i}
								perf={perf}
								players={players}
							/>
						);
					})}

				{performances.length == 0 ? (
					<span>No matches found with these filters.</span>
				) : null}
			</div>
		</>
	);
}

function PerformanceDisplay({
	perf,
	i,
	matches,
	elos,
	players,
}: {
	matches: Record<string, Match>;
	perf: PlayerPerformance;
	i: number;
	players: OptionalPlayerInformation[];
	elos: EloInformation;
}) {
	if (perf.match == null) return null;

	const isMobile = useIsMobile();

	const match = matches[perf.match];

	let red_scores = 0;
	let blue_scores = 0;

	for (const info of [...match.blue_players, ...match.red_players]) {
		if (info.team == Team.RED) {
			red_scores += info.scores;
		} else {
			blue_scores += info.scores;
		}
	}

	let winner: Team = Team.RED;

	if (red_scores == 5) {
		winner = Team.RED;
	} else if (blue_scores == 5) {
		winner = Team.BLUE;
	}

	function TeamInfo({ team, side }: { team: Team; side: "left" | "right" }) {
		const performances = team == Team.RED ? match.red_players : match.blue_players;
		return (
			<div
				className={
					"h-full flex text-center " +
					(side == "left" ? "flex-row" : "flex-row-reverse") +
					" rounded-sm space-x-1"
				}
			>
				<div
					className={
						"grid grid-cols-4 w-26 rounded-sm p-1 space-x-1 " +
						(side == "right" ? "items-end [direction:rtl] " : "") +
						(team == Team.RED ? "bg-red-500/80" : "bg-blue-600/80")
					}
				>
					{performances
						.sort((a, b) => {
							const a_p = players.find((p) => p.exists && p.id == a.user);
							const b_p = players.find((p) => p.exists && p.id == b.user);
							if (!a_p || !a_p.exists || !a_p.username) return 1;
							if (!b_p || !b_p.exists || !b_p.username) return -1;
							return a_p.username.localeCompare(b_p.username);
						})
						.map((p, i) => {
							const player = players.find((_p) => {
								if (!_p.exists || !_p) return false;
								return _p.id == p.user;
							});
							if (player == undefined || !player.exists) return null;
							return (
								<MinecraftAvatar
									key={i}
									size="size-5"
									uuid={player.uuid}
									tooltip={
										isMobile ? undefined : (
											<>
												<span>{player.username ?? ""}</span> <br />
												<span>Goals: {p.scores}</span> <br />
												<span>Kills: {p.kills}</span> <br />
												<span>Deaths: {p.deaths}</span> <br />
												<span>Voids: {p.voids}</span>
											</>
										)
									}
								/>
							);
						})}
				</div>
			</div>
		);
	}

	const [hovered, setHovered] = useState<boolean>(false);

	return (
		<Popover key={i}>
			<PopoverTrigger asChild>
				<div
					className={
						"justify-between grid grid-cols-[auto_1fr_auto] rounded-sm items-center hover:bg-accent cursor-pointer " +
						(i % 2 == 0 ? "bg-sidebar-accent/40" : "")
					}
				>
					{perf.team == Team.RED ? (
						<TeamInfo team={Team.RED} side="left" />
					) : (
						<TeamInfo team={Team.BLUE} side="left" />
					)}

					<div className={"text-center grid grid-cols-3"}>
						<div>
							<span
								className={
									"font-bold " +
									(perf.team == Team.RED ? "text-red-400" : "text-blue-400")
								}
							>
								{perf.team == Team.RED ? red_scores : blue_scores}
							</span>
							<span className="text-accent-foreground/50 font-bold"> - </span>
							<span
								className={
									"font-bold " +
									(perf.team == Team.RED ? "text-blue-400" : "text-red-400")
								}
							>
								{perf.team == Team.RED ? blue_scores : red_scores}
							</span>
						</div>
						<div className="flex flex-row items-center justify-center">
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
						{winner == perf.team ? (
							<span
								onMouseEnter={() => setHovered(true)}
								onMouseLeave={() => setHovered(false)}
								className="text-green-400"
							>
								{hovered ? (
									<span
										className={
											Math.floor(elos.deltas[match.id][perf.user!]) > 0
												? "text-green-400"
												: "text-red-400"
										}
									>
										{Math.floor(elos.deltas[match.id][perf.user!]) > 0
											? "+"
											: ""}
										{Math.floor(elos.deltas[match.id][perf.user!])}
									</span>
								) : (
									"Won"
								)}
							</span>
						) : (
							<span
								onMouseEnter={() => setHovered(true)}
								onMouseLeave={() => setHovered(false)}
								className="text-red-400"
							>
								{hovered ? (
									<span
										className={
											Math.floor(elos.deltas[match.id][perf.user!]) > 0
												? "text-green-400"
												: "text-red-400"
										}
									>
										{Math.floor(elos.deltas[match.id][perf.user!]) > 0
											? "+"
											: ""}
										{Math.floor(elos.deltas[match.id][perf.user!])}
									</span>
								) : (
									"Lost"
								)}
							</span>
						)}
					</div>
					{perf.team == Team.RED ? (
						<TeamInfo team={Team.BLUE} side="right" />
					) : (
						<TeamInfo team={Team.RED} side="right" />
					)}
				</div>
			</PopoverTrigger>
			<PopoverContent>
				<PopoverHeader>
					<PopoverTitle>What a cool match.</PopoverTitle>
					<PopoverDescription>
						This will contain more info about the match.
						<img
							src={
								"/Maps/" +
								(perf.team == Team.RED ? "Red" : "Blue") +
								"/" +
								match.map +
								".png"
							}
							alt=""
						/>
					</PopoverDescription>
				</PopoverHeader>
			</PopoverContent>
		</Popover>
	);
}
