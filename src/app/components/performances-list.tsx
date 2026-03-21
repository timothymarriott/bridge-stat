import {
	Match,
	OptionalPlayerInformation,
	PlayerPerformance,
	SortMode,
	Team,
} from "@/worker/types";
import MinecraftAvatar from "./mc-avatar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useEffect, useMemo, useState } from "react";
import { FilterState } from "../routes/player/$username";
import React from "react";
import { MatchInfo } from "./match-info";
import { Skeleton } from "@/components/ui/skeleton";
import { useData } from "./data-hook";

export default function PerformancesList({
	player,
	list,
	sortMode,
	filterState,
}: {
	player: OptionalPlayerInformation;
	list: PlayerPerformance[];
	sortMode: SortMode;
	filterState: FilterState;
}) {
	const data = useData();
	const matches = data.matches;

	const STEP_COUNT = 5;

	const [count, setCount] = useState(25);

	const performances = useMemo<PlayerPerformance[]>(() => {
		if (matches != null) {
			return list
				.filter((a) => {
					if (filterState.filterTeamCount) {
						if (!a.match) return false;
						const match = data.matchesMap[a.match];

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
					if (!a.match) return a.id - b.id;
					const amatch = data.matchesMap[a.match];

					if (!b.match) return a.id - b.id;
					const bmatch = data.matchesMap[b.match];
					if (sortMode == SortMode.OldToNew) {
						return amatch.uploaded_at - bmatch.uploaded_at;
					}
					return bmatch.uploaded_at - amatch.uploaded_at;
				});
		}
		return [];
	}, [list, filterState, matches, sortMode, data.matchesMap]);

	useEffect(() => {
		void (async () => {
			await new Promise<void>((resolve) => {
				setCount(0);
				resolve();
			});
		})();
	}, [player]);

	useEffect(() => {
		if (count >= performances.length) return;

		const id = setTimeout(() => {
			setCount((c) => c + STEP_COUNT);
		}, 150);

		return () => {
			clearTimeout(id);
		};
	}, [count, performances.length]);

	return (
		<div className="space-y-1">
			{matches != null &&
				data.elos != null &&
				performances.length > 0 &&
				performances.map((perf, i) => {
					if (perf.match == null) return null;

					if (i >= count) {
						return (
							<Skeleton
								style={{ width: 528, height: 28 }}
								className="bg-muted-foreground/20"
								key={perf.id}
							/>
						);
					}

					return (
						<PerformanceDisplay
							key={perf.id}
							match={data.matchesMap[perf.match]}
							i={i}
							perf={perf}
						/>
					);
				})}

			{performances.length == 0 ? <span>No matches found with these filters.</span> : null}
		</div>
	);
}

function TeamInfo({
	team,
	side,
	match,
	priority,
}: {
	team: Team;
	side: "left" | "right";
	match: Match;
	priority?: string;
}) {
	const data = useData();
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
						const a_p = data.players.find((p) => p.id == a.user);
						const b_p = data.players.find((p) => p.id == b.user);
						if (!a_p?.username) return 1;
						if (!b_p?.username) return -1;

						if (a_p.id == priority && b_p.id != priority) {
							return -Infinity;
						}

						if (b_p.id == priority && a_p.id != priority) {
							return Infinity;
						}

						return a_p.username.localeCompare(b_p.username);
					})
					.map((p, i) => {
						const player = data.players.find((_p) => {
							return _p.id == p.user;
						});
						if (!player) return null;
						return (
							<MinecraftAvatar
								key={i}
								size="size-5"
								uuid={player.uuid}
								tooltip={
									<>
										<span>{player.username ?? ""}</span> <br />
										<span>Goals: {p.scores}</span> <br />
										<span>Kills: {p.kills}</span> <br />
										<span>Deaths: {p.deaths}</span> <br />
										<span>Voids: {p.voids}</span>
									</>
								}
							/>
						);
					})}
			</div>
		</div>
	);
}

export const TeamInfoComponent = React.memo(TeamInfo);

export function PerformanceDisplay({
	perf,
	i,
	match,
}: {
	match: Match;
	perf?: PlayerPerformance;
	i: number;
}) {
	const data = useData();
	const [hovered, setHovered] = useState<boolean>(false);

	const winner: Team = match.red_scores > match.blue_scores ? Team.RED : Team.BLUE;

	const player: OptionalPlayerInformation = data.players
		.map<OptionalPlayerInformation>((p) => {
			return { ...p, exists: true };
		})
		.find((p) => perf && p.exists && p.id == perf.user) ?? {
		exists: false,
	};

	return (
		<Popover key={i}>
			<PopoverTrigger asChild>
				<div
					className={
						"justify-between grid grid-cols-[auto_1fr_auto] rounded-sm items-center hover:bg-accent cursor-pointer " +
						(i % 2 == 0 ? "bg-sidebar-accent/40" : "")
					}
					onMouseEnter={() => {
						setHovered(true);
					}}
					onMouseLeave={() => {
						setHovered(false);
					}}
				>
					{!perf || perf.team == Team.RED ? (
						<TeamInfoComponent
							match={match}
							team={Team.RED}
							side="left"
							priority={player.exists ? player.id : undefined}
						/>
					) : (
						<TeamInfoComponent
							match={match}
							team={Team.BLUE}
							side="left"
							priority={player.exists ? player.id : undefined}
						/>
					)}

					<div className={"text-center grid grid-cols-3"}>
						<div>
							{perf ? (
								<>
									<span
										className={
											"font-bold " +
											(perf.team == Team.RED
												? "text-red-400"
												: "text-blue-400")
										}
									>
										{perf.team == Team.RED
											? match.red_scores
											: match.blue_scores}
									</span>
									<span className="text-accent-foreground/50 font-bold"> - </span>
									<span
										className={
											"font-bold " +
											(perf.team == Team.RED
												? "text-blue-400"
												: "text-red-400")
										}
									>
										{perf.team == Team.RED
											? match.blue_scores
											: match.red_scores}
									</span>
								</>
							) : (
								<>
									<span className={"font-bold text-red-400"}>
										{match.red_scores}
									</span>
									<span className="text-accent-foreground/50 font-bold"> - </span>
									<span className={"font-bold text-blue-400"}>
										{match.blue_scores}
									</span>
								</>
							)}
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
						{perf ? (
							winner == perf.team ? (
								<span className="text-green-400">
									{hovered && data.elos && player.exists && perf.user ? (
										<span
											className={
												Math.floor(
													data.elos.matches[match.id].deltas[perf.user],
												) > 0
													? "text-green-400"
													: "text-red-400"
											}
										>
											{Math.floor(
												data.elos.matches[match.id].deltas[perf.user],
											) > 0
												? "+"
												: ""}
											{Math.floor(
												data.elos.matches[match.id].deltas[perf.user],
											)}
										</span>
									) : (
										"Won"
									)}
								</span>
							) : (
								<span className="text-red-400">
									{hovered && data.elos && player.exists && perf.user ? (
										<span
											className={
												Math.floor(
													data.elos.matches[match.id].deltas[perf.user],
												) > 0
													? "text-green-400"
													: "text-red-400"
											}
										>
											{Math.floor(
												data.elos.matches[match.id].deltas[perf.user],
											) > 0
												? "+"
												: ""}
											{Math.floor(
												data.elos.matches[match.id].deltas[perf.user],
											)}
										</span>
									) : (
										"Lost"
									)}
								</span>
							)
						) : (
							<span className={winner == Team.RED ? "text-red-400" : "text-blue-400"}>
								{winner == Team.RED ? "Red" : "Blue"}
							</span>
						)}
					</div>
					{!perf || perf.team == Team.RED ? (
						<TeamInfoComponent
							match={match}
							team={Team.BLUE}
							side="right"
							priority={player.exists ? player.id : undefined}
						/>
					) : (
						<TeamInfoComponent
							match={match}
							team={Team.RED}
							side="right"
							priority={player.exists ? player.id : undefined}
						/>
					)}
					{/* <span>
						{Math.floor(
							(new Date().getTime() - match.uploaded_at) / (1000 * 60 * 60 * 24),
						)}
						d
					</span> */}
				</div>
			</PopoverTrigger>
			<PopoverContent
				onOpenAutoFocus={(e) => {
					e.preventDefault();
				}}
				className="w-max"
			>
				{perf && player.exists ? (
					<MatchInfo match={match} perf={perf} player={player}></MatchInfo>
				) : null}
			</PopoverContent>
		</Popover>
	);
}
