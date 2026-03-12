import { usePlayerInfo, useQueryData } from "@/app/auth-hooks";
import MinecraftAvatar from "@/app/components/mc-avatar";
import PlayerDetails from "@/app/components/player-details";
import PlayerPerformancesList from "@/app/components/player-performances-list";
import { playersQuery } from "@/app/queries";
import { router } from "@/app/router";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { Switch } from "@/components/ui/switch";
import { useIsMobile } from "@/hooks/use-mobile";
import { CalculateElos, EloInformation } from "@/lib/stats";
import { Team } from "@/worker/types";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/player/$username")({
	component: User,
});

export enum SortMode {
	NewToOld = "new_to_old",
	OldToNew = "old_to_new",
}

export type FilterState = {
	filterTeamCount: boolean;
	yourTeamCount: number;
	theirTeamCount: number;
};

function User() {
	const { username } = Route.useParams();

	const [kdr, setKDR] = useState<number>(1);

	const [winCount, setWinCount] = useState<number>(0);
	const [goalsPerGame, setGoalsPerGame] = useState<number>(0);
	const [lossCount, setLossCount] = useState<number>(0);
	const isMobile = useIsMobile();

	const data = useQueryData(playersQuery);

	const matches = data?.matches ?? null;
	const players = data?.players ?? [];

	const player = usePlayerInfo(username);
	``;
	if (matches && player?.exists) {
		player.performances = [];
		for (const match of Object.values(matches)) {
			const perf = [...match.blue_players, ...match.red_players].find(
				(p) => p.user == player.id,
			);
			if (perf != undefined) player.performances.push(perf);
		}
	}

	console.log(players);

	const [elos, setElos] = useState<EloInformation | null>(null);

	const [loading, setLoading] = useState<boolean>(false);

	useEffect(() => {
		if (player != null && matches != null && player.exists && loading) {
			setLoading(false);
		}
		console.log(player, matches);
		if (player != null && player.exists && matches != null) {
			let total_kills = 0;
			let total_deaths = 0;

			let total_goals = 0;

			for (let i = 0; i < player.performances.length; i++) {
				total_kills += player.performances[i].kills;
				total_deaths += player.performances[i].deaths;
				total_goals += player.performances[i].scores;
			}
			setKDR(total_kills / total_deaths);
			setGoalsPerGame(total_goals / player.performances.length);

			let win_count = 0;
			let loss_count = 0;

			player.performances.map((perf) => {
				if (perf.match == null) return null;

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

				if (winner == perf.team) {
					win_count += 1;
				} else {
					loss_count += 1;
				}
			});

			setWinCount(win_count);
			setLossCount(loss_count);
		}
	}, [player, matches, username]);

	useEffect(() => {
		if (matches != null && players.length > 0) {
			const elo = CalculateElos(players, Object.values(matches));

			setElos(elo);
		}
	}, [data, username]);

	const [sortMode, setSortMode] = useState<SortMode>(SortMode.NewToOld);
	const [filterState, setFilterState] = useState<FilterState>({
		filterTeamCount: false,
		theirTeamCount: 3,
		yourTeamCount: 3,
	});
	const [tempFilterState, setTempFilterState] = useState<FilterState>({
		filterTeamCount: false,
		theirTeamCount: 3,
		yourTeamCount: 3,
	});

	return (
		<div className="flex flex-col h-full space-y-2">
			{player == null || matches == null ? (
				<div className="flex flex-col items-center">
					<Spinner className="size-16" />
					<div className="w-full text-center h-full">Loading...</div>
				</div>
			) : player.exists ? (
				<>
					<Card className="ring-sidebar-border rounded-lg min-h-[62.7667px] shrink-0">
						<CardHeader>
							<CardTitle className="flex flex-row items-center space-x-2 text-lg">
								<MinecraftAvatar uuid={player.uuid} />{" "}
								<span>{player.username}</span>
							</CardTitle>
						</CardHeader>
						<CardContent className="text-sm flex flex-row space-x-3 flex-wrap">
							<div>
								<span className="font-bold">{winCount + lossCount}</span>
								<span className="text-accent-foreground/50"> games played</span>
							</div>
							<span className="font-extrabold">•</span>
							<div>
								<span className="font-bold">{winCount}</span>
								<span className="text-accent-foreground/50"> games won</span>
							</div>
							<span className="font-extrabold">•</span>
							<div>
								<span className="font-bold">{lossCount}</span>
								<span className="text-accent-foreground/50"> games lost</span>
							</div>
							<span className="font-extrabold">•</span>
							<div>
								<span className="font-bold">
									{winCount + lossCount > 0
										? Math.round((winCount / (winCount + lossCount)) * 100)
										: 0}
								</span>
								<span className="text-accent-foreground/50">% winrate</span>
							</div>
							<span className="font-extrabold">•</span>
							<div>
								<span className="text-accent-foreground/50">kdr </span>
								<span className="font-bold">{Math.round(kdr * 100) / 100}</span>
							</div>

							<span className="font-extrabold">•</span>
							<div>
								<span className="font-bold">
									{Math.round(goalsPerGame * 100) / 100}
								</span>
								<span className="text-accent-foreground/50">
									{" "}
									goals per game on average
								</span>
							</div>
						</CardContent>
					</Card>
					{isMobile ? (
						<Card className="flex-1 min-h-0 flex flex-col w-full ring-sidebar-border rounded-lg">
							<CardHeader>
								<CardTitle>Performances</CardTitle>
							</CardHeader>
							<CardContent className="flex-1 min-h-0 px-1">
								<ScrollArea className="h-full px-3">
									{loading ? (
										<p>Loading...</p>
									) : (
										<PlayerPerformancesList
											player={player}
											sortMode={sortMode}
											filterState={filterState}
										/>
									)}
								</ScrollArea>
							</CardContent>
						</Card>
					) : (
						<div className="flex-1 min-h-0 flex flex-row space-x-2">
							<Card
								className="ring-sidebar-border rounded-lg max-h-full"
								style={{
									width: "calc(var(--spacing) * 140)",
								}}
							>
								<CardHeader>
									<CardTitle>Performances</CardTitle>
									<div className="flex flex-row space-x-1 items-center">
										<Dialog>
											<DialogTrigger asChild>
												<Button variant={"secondary"}>Filters</Button>
											</DialogTrigger>
											<DialogContent>
												<DialogHeader>
													<DialogTitle>Filters</DialogTitle>
												</DialogHeader>
												<div className="flex flex-row space-x-1 items-center">
													<Switch
														checked={tempFilterState.filterTeamCount}
														onCheckedChange={(v) => {
															setTempFilterState((o) => {
																return {
																	...o,
																	filterTeamCount: v,
																};
															});
														}}
													/>
													<span>Player Count</span>
												</div>
												{tempFilterState.filterTeamCount ? (
													<div className="space-y-2">
														<Label>Your Team</Label>
														<Input
															defaultValue={
																tempFilterState.yourTeamCount
															}
															type="number"
															onChange={(v) => {
																setTempFilterState((o) => {
																	return {
																		...o,
																		yourTeamCount:
																			Number.parseInt(
																				v.target.value,
																			),
																	};
																});
															}}
														></Input>

														<Label>Other Team</Label>
														<Input
															defaultValue={
																tempFilterState.theirTeamCount
															}
															type="number"
															onChange={(v) => {
																setTempFilterState((o) => {
																	return {
																		...o,
																		theirTeamCount:
																			Number.parseInt(
																				v.target.value,
																			),
																	};
																});
															}}
														></Input>
													</div>
												) : null}
												<DialogFooter>
													<DialogClose
														asChild
														onClick={() => {
															setFilterState(tempFilterState);
														}}
													>
														<Button>Apply</Button>
													</DialogClose>
												</DialogFooter>
											</DialogContent>
										</Dialog>
										<span>Sort</span>
										<Select
											onValueChange={(v) => {
												setSortMode(v as SortMode);
											}}
											defaultValue="new_to_old"
										>
											<SelectTrigger>
												<SelectValue />
											</SelectTrigger>
											<SelectContent>
												<SelectGroup>
													<SelectItem value="new_to_old">
														New To Old
													</SelectItem>
													<SelectItem value="old_to_new">
														Old To New
													</SelectItem>
												</SelectGroup>
											</SelectContent>
										</Select>
									</div>
								</CardHeader>
								<CardContent className="flex-1 min-h-0 px-1">
									<ScrollArea className="h-full px-3">
										{loading ? (
											<p>Loading...</p>
										) : (
											<PlayerPerformancesList
												player={player}
												sortMode={sortMode}
												filterState={filterState}
											/>
										)}
									</ScrollArea>
								</CardContent>
							</Card>

							<Card className="ring-sidebar-border rounded-lg max-h-full flex-1">
								<CardHeader>
									<CardTitle>User Info</CardTitle>
								</CardHeader>
								<CardContent className="flex-1 min-h-0 px-1">
									<ScrollArea className="h-full px-3">
										{elos != null ? (
											<>
												<PlayerDetails
													player={player}
													elos={elos}
													players={players}
													matches={matches}
												/>
											</>
										) : null}
									</ScrollArea>
								</CardContent>
							</Card>
						</div>
					)}
				</>
			) : (
				<div className="flex flex-col items-center">
					<div className="text-red-400 w-full text-center h-full">Player Not Found</div>
					<div>{username}</div>
					<Button
						onClick={() => {
							router.navigate({
								to: "/",
							});
						}}
					>
						Return Home
					</Button>
				</div>
			)}
		</div>
	);
}
