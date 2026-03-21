import {
	ChartConfig,
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
} from "@/components/ui/chart";
import { EloInformation, GetConfidencePercentage, GetELO, MatchEloInformation } from "@/lib/stats";
import { PlayerInformation } from "@/worker/types";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { Rating } from "ts-trueskill";
import { MatchInfo } from "./match-info";

const eloChartConfig = {
	elo: {
		label: "Elo",
		color: "var(--chart-1)",
	},
	confidenceScaled: {
		label: "Elo",
		color: "var(--color-red-400)",
	},
} satisfies ChartConfig;

export default function PlayerDetails({
	player,
	elos,
}: {
	player: PlayerInformation;
	elos: EloInformation;
}) {
	let eloChartData: {
		date: number;
		elo: number;
		confidence: number;
		confidenceScaled: number;
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
				const elo = GetELO(v.totals[player.id]);
				eloChartData.push({
					date: v.match.uploaded_at,
					elo: elo,
					confidence: GetConfidencePercentage(v.totals[player.id]),
					confidenceScaled: 0,
					rating: v.totals[player.id],
					info: v,
				});
			}
		});

	const maxElo = Math.max(...eloChartData.map((d) => d.elo));
	const minElo = Math.min(...eloChartData.map((d) => d.elo));

	eloChartData = eloChartData.map((d) => ({
		...d,
		confidenceScaled: (d.confidence * (Math.abs(maxElo - minElo) * 3)) / 100, // scale 0–100% to 50% of Elo range
	}));

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
					<XAxis dataKey="date" tickMargin={8} tickCount={4} tick={false} />
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
											<MatchInfo player={player} match={match} perf={perf} />
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
						dataKey="confidenceScaled"
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
