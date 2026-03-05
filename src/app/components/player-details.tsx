import {
	ChartConfig,
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
} from "@/components/ui/chart";
import { EloInformation, GetELO, MatchEloInformation } from "@/lib/stats";
import { Match, OptionalPlayerInformation, PlayerInformation } from "@/worker/types";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { Rating } from "ts-trueskill";

const chartConfig = {
	elo: {
		label: "Elo",
		color: "#2563eb",
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
	const chartData: {
		date: number;
		elo: number;
		confidence: number;
		rating: Rating;
		info: MatchEloInformation;
	}[] = [];

	Object.values(elos.matches).forEach((v) => {
		if (v.totals[player.id] != undefined) {
			chartData.push({
				date: chartData.length,
				elo: GetELO(v.totals[player.id]),
				confidence: v.totals[player.id].pi * 1500,
				rating: v.totals[player.id],
				info: v,
			});
		}
	});
	return (
		<>
			<ChartContainer config={chartConfig}>
				<AreaChart
					accessibilityLayer
					data={chartData}
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
										return (
											<div className="space-x-1">
												<span>
													{Math.floor(GetELO(payload.rating))} Elo
												</span>
												<span
													className={
														Math.floor(payload.info.deltas[player.id]) >
														0
															? "text-green-400"
															: "text-red-400"
													}
												>
													{Math.floor(payload.info.deltas[player.id]) > 0
														? "+"
														: " "}
													{Math.abs(
														Math.floor(payload.info.deltas[player.id]),
													)}
												</span>
												<br />
												<span>
													{Math.round(payload.rating.pi * 100)}% Confident
												</span>
											</div>
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
							<stop offset="5%" stopColor="var(--chart-2)" stopOpacity={0.8} />
							<stop offset="95%" stopColor="var(--chart-2)" stopOpacity={0.1} />
						</linearGradient>
					</defs>
					<Area
						dataKey="elo"
						type="natural"
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
						stroke="var(--chart-2)"
						stackId="b"
					/>
				</AreaChart>
			</ChartContainer>
		</>
	);
}
