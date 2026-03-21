import {
	ChartConfig,
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
} from "@/components/ui/chart";
import { EloInformation, GetELO, MatchEloInformation } from "@/lib/stats";
import { OptionalPlayerInformation, PlayerInformation } from "@/worker/types";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { Rating } from "ts-trueskill";
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

export default function PlayerDetails({
	player,
	elos,
	players,
}: {
	player: PlayerInformation;
	elos: EloInformation;
	players: OptionalPlayerInformation[];
}) {
	const eloChartData: {
		date: number;
		elo: number;
		confidence: number;
		rating: Rating;
		info: MatchEloInformation;
	}[] = [];

	Object.values(elos.matches)
		.sort((a, b) => a.match.uploaded_at - b.match.uploaded_at)
		.forEach((v) => {
			const performance = [...v.match.blue_players, ...v.match.red_players].find(
				(p) => p.user == player.id,
			);
			if (performance != undefined) {
				eloChartData.push({
					date: v.match.uploaded_at,
					elo: GetELO(v.totals[player.id]),
					confidence: v.totals[player.id].pi * 1500,
					rating: v.totals[player.id],
					info: v,
				});
			}
		});

	return (
		<>
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
					<XAxis
						dataKey="date"
						tickMargin={8}
						tickCount={4}
						tick={false}
						tickFormatter={(d) =>
							`${Math.floor((new Date().getTime() - (d as number)) / (1000 * 60 * 60 * 24)).toString()}d`
						}
					/>
					<YAxis dataKey="elo" tickMargin={8} />
					<ChartTooltip
						cursor={true}
						content={
							<ChartTooltipContent
								hideLabel
								formatter={(_value, _name, item, index) => {
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
							<stop offset="5%" stopColor="var(--chart-1)" stopOpacity={0.8} />
							<stop offset="95%" stopColor="var(--chart-1)" stopOpacity={0.1} />
						</linearGradient>
						<linearGradient id="fillConfidence" x1="0" y1="0" x2="0" y2="1">
							<stop offset="5%" stopColor="var(--chart-3)" stopOpacity={0.8} />
							<stop offset="95%" stopColor="var(--chart-3)" stopOpacity={0.1} />
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
				This is the players rating according to the TrueSkill2 system. <br /> The numeric
				value is calculated via this formula x = μ * 100 + 1000.
				<br /> The confidence is π treated as a percentage.
			</span>
		</>
	);
}
