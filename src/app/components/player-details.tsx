import {
	ChartConfig,
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
} from "@/components/ui/chart";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EloInformation, GetELO, MatchEloInformation } from "@/lib/stats";
import { Match, OptionalPlayerInformation, PlayerInformation, Team } from "@/worker/types";
import React from "react";
import { Area, AreaChart, CartesianGrid, ReferenceArea, XAxis, YAxis } from "recharts";
import { Rating } from "ts-trueskill";
import { TeamInfo } from "./player-performances-list";
import { MatchInfo } from "./match-info";

const eloChartConfig = {
	elo: {
		label: "Elo",
		color: "var(--chart-1)",
	},
	confidence: {
		label: "Elo",
		color: "var(--chart-2)",
	},
} satisfies ChartConfig;

const winsChartConfig = {
	win: {
		label: "Win Rate",
		color: "var(--color-green-400)",
	},
	loss: {
		label: "Loss Rate",
		color: "var(--color-red-400)",
	},
} satisfies ChartConfig;

export default function PlayerDetails({
	player,
	elos,
	players,
	matches,
}: {
	player: PlayerInformation;
	elos: EloInformation;
	players: OptionalPlayerInformation[];
	matches: Record<string, Match>;
}) {
	const eloChartData: {
		date: number;
		elo: number;
		confidence: number;
		rating: Rating;
		info: MatchEloInformation;
	}[] = [];

	const winsChartData: {
		date: number;
		win: number;
		loss: number;
	}[] = [];

	let totalWin = 0;
	let totalLoss = 0;

	let totalMatches = 0;

	let totalKill = 0;
	let totalDeath = 0;

	Object.values(elos.matches).forEach((v) => {
		const performance = [...v.match.blue_players, ...v.match.red_players].find(
			(p) => p.user == player.id,
		);
		if (v.totals[player.id] != undefined && performance != undefined) {
			totalMatches++;
			eloChartData.push({
				date: eloChartData.length + 1,
				elo: GetELO(v.totals[player.id]),
				confidence: v.totals[player.id].pi * 1500,
				rating: v.totals[player.id],
				info: v,
			});

			totalKill += performance.kills;
			totalDeath += performance.deaths;

			if (v.match.blue_scores == 5 && v.match.blue_players.find((p) => p.user == player.id)) {
				totalWin += 1;
			}
			if (v.match.red_scores == 5 && v.match.red_players.find((p) => p.user == player.id)) {
				totalWin += 1;
			}

			if (
				v.match.blue_scores == 5 &&
				v.match.blue_players.find((p) => p.user == player.id) == undefined
			) {
				totalLoss += 1;
			}
			if (
				v.match.red_scores == 5 &&
				v.match.red_players.find((p) => p.user == player.id) == undefined
			) {
				totalLoss += 1;
			}

			winsChartData.push({
				date: winsChartData.length + 1,
				win: totalWin / totalMatches,
				loss: totalLoss / totalMatches,
			});
		}
	});

	return (
		<>
			<Tabs defaultValue="elo">
				<TabsList>
					<TabsTrigger value="elo">Elo</TabsTrigger>
					<TabsTrigger value="wins">Game Results</TabsTrigger>
				</TabsList>
				<TabsContent value="elo">
					<ChartContainer config={eloChartConfig}>
						<AreaChart
							accessibilityLayer
							data={eloChartData}
							margin={{
								left: 12,
								right: 12,
							}}
						>
							<CartesianGrid vertical={false} />
							<XAxis dataKey="date" tickMargin={8} />
							<YAxis dataKey="elo" tickMargin={8} />
							<ChartTooltip
								cursor={true}
								content={
									<ChartTooltipContent
										hideLabel
										formatter={(value, name, item, index) => {
											if (index == 0) {
												const payload = item.payload as {
													date: number;
													elo: number;
													confidence: number;
													rating: Rating;
													info: MatchEloInformation;
												};

												const match = payload.info.match;

												const perf = [
													...payload.info.match.blue_players,
													...payload.info.match.red_players,
												].find((p) => p.user == player.id);
												if (perf == undefined) {
													return null;
												}

												return (
													<MatchInfo
														players={players}
														player={player}
														eloInfo={payload.info}
														match={match}
														perf={perf}
													/>
												);
											}
										}}
									/>
								}
							/>
							<defs>
								<linearGradient id="fillElo" x1="0" y1="0" x2="0" y2="1">
									<stop
										offset="5%"
										stopColor="var(--chart-1)"
										stopOpacity={0.8}
									/>
									<stop
										offset="95%"
										stopColor="var(--chart-1)"
										stopOpacity={0.1}
									/>
								</linearGradient>
								<linearGradient id="fillConfidence" x1="0" y1="0" x2="0" y2="1">
									<stop
										offset="5%"
										stopColor="var(--chart-3)"
										stopOpacity={0.8}
									/>
									<stop
										offset="95%"
										stopColor="var(--chart-3)"
										stopOpacity={0.1}
									/>
								</linearGradient>
							</defs>
							<Area
								dataKey="elo"
								type="linear"
								fill="url(#fillElo)"
								fillOpacity={0.4}
								stroke="var(--chart-1)"
								stackId="a"
							/>
							<Area
								dataKey="confidence"
								type="natural"
								fill="url(#fillConfidence)"
								fillOpacity={0.4}
								stroke="var(--chart-3)"
								stackId="b"
							/>
						</AreaChart>
					</ChartContainer>
					<span className="text-accent-foreground/50">
						This is the players rating according to the TrueSkill2 system. <br /> The
						numeric value is calculated via this formula x = μ * 100 + 1000.
						<br /> The confidence is π treated as a percentage.
					</span>
				</TabsContent>
				<TabsContent value="wins">
					<ChartContainer config={winsChartConfig}>
						<AreaChart
							accessibilityLayer
							data={winsChartData}
							margin={{
								left: 12,
								right: 12,
							}}
						>
							<CartesianGrid vertical={false} />
							<XAxis dataKey="date" tickMargin={8} />
							<YAxis dataKey="win" tickMargin={8} />
							<ChartTooltip
								cursor={true}
								content={<ChartTooltipContent hideLabel />}
							/>
							<defs>
								<linearGradient id="fillWin" x1="0" y1="0" x2="0" y2="1">
									<stop
										offset="5%"
										stopColor="var(--color-green-400)"
										stopOpacity={0.8}
									/>
									<stop
										offset="95%"
										stopColor="var(--color-green-400)"
										stopOpacity={0.1}
									/>
								</linearGradient>
								<linearGradient id="fillLoss" x1="0" y1="1" x2="0" y2="0">
									<stop
										offset="5%"
										stopColor="var(--color-red-400)"
										stopOpacity={0.9}
									/>
									<stop
										offset="95%"
										stopColor="var(--color-red-400)"
										stopOpacity={0.2}
									/>
								</linearGradient>
							</defs>
							<Area
								dataKey="win"
								type="natural"
								fill="url(#fillWin)"
								fillOpacity={0.4}
								strokeWidth={2}
								stroke="var(--color-green-400)"
								stackId="a"
							/>
							<Area
								dataKey="loss"
								type="natural"
								fill="url(#fillLoss)"
								fillOpacity={0.4}
								strokeOpacity={0}
								activeDot={<></>}
								stroke="var(--color-red-400)"
								stackId="a"
							/>
						</AreaChart>
					</ChartContainer>
					<span className="text-accent-foreground/50">
						This is a rolling average of the players win rate.
					</span>
				</TabsContent>
			</Tabs>
		</>
	);
}
