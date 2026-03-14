import {
	ChartConfig,
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
} from "@/components/ui/chart";
import { Match, OptionalPlayerInformation, Team } from "@/worker/types";
import { Label, PolarRadiusAxis, RadialBar, RadialBarChart } from "recharts";

export function ScoreDistrobutionChart({
	match,
	team,
	players,
}: {
	match: Match;
	team: Team;
	players: OptionalPlayerInformation[];
}) {
	const perfs = team == Team.RED ? match.red_players : match.blue_players;
	const other_perfs = team == Team.RED ? match.blue_players : match.red_players;

	const chartData: any = { match: match.id };

	const chartConfig: any = {};

	let total = 0;

	perfs.forEach((p) => {
		const player = players.find((_p) => _p.exists && _p.id == p.user);
		if (p.user && p.scores > 0 && player && player.exists) {
			chartData[p.user] = p.scores;

			chartConfig[p.user] = {
				label: player.username,
				color: team == Team.RED ? "var(--color-red-400)" : "var(--color-blue-400)",
			};

			total += p.scores;
		}
	});

	let other_total = 0;

	other_perfs.forEach((p) => {
		const player = players.find((_p) => _p.exists && _p.id == p.user);
		if (p.user && p.scores > 0 && player && player.exists) {
			chartData["other_" + p.user] = p.scores;

			chartConfig["other_" + p.user] = {
				label: player.username,
				color: team == Team.RED ? "var(--color-red-400)" : "var(--color-blue-400)",
			};

			other_total += p.scores;
		}
	});

	return (
		<ChartContainer config={chartConfig} className="aspect-square w-64 h-64">
			<RadialBarChart
				data={[chartData]}
				endAngle={180}
				innerRadius={80}
				outerRadius={130}
				className="h-32"
			>
				<ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
				<PolarRadiusAxis tick={false} tickLine={false} axisLine={false}>
					<Label
						content={({ viewBox }) => {
							if (viewBox && "cx" in viewBox && "cy" in viewBox) {
								return (
									<text x={viewBox.cx} y={viewBox.cy} textAnchor="middle">
										<tspan
											x={viewBox.cx}
											y={(viewBox.cy || 0) + 4}
											className="fill-muted-foreground"
										>
											Score Distrobution
										</tspan>
									</text>
								);
							}
						}}
					/>
				</PolarRadiusAxis>
				{perfs.map((p) => {
					if (!p.user) return null;
					return (
						<RadialBar
							key={p.user}
							dataKey={p.user}
							stackId="a"
							cornerRadius={5}
							fill={
								team == Team.RED ? "var(--color-red-400)" : "var(--color-blue-400)"
							}
							className="stroke-transparent stroke-2"
						/>
					);
				})}

				{other_perfs.map((p) => {
					if (!p.user) return null;
					return (
						<RadialBar
							key={p.user}
							dataKey={"other_" + p.user}
							stackId="b"
							cornerRadius={5}
							fill={
								team == Team.RED ? "var(--color-blue-400)" : "var(--color-red-400)"
							}
							className="stroke-transparent stroke-2"
						/>
					);
				})}
			</RadialBarChart>
		</ChartContainer>
	);
}
