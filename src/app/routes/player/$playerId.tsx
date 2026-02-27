import { usePlayerInfo } from "@/app/auth-hooks";
import MinecraftAvatar from "@/app/components/mc-avatar";
import PlayerPerformancesList from "@/app/components/player-performances-list";
import { matchesQuery } from "@/app/queries";
import { router } from "@/app/router";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/player/$playerId")({
	beforeLoad: async ({ context }) => {
		const matches = context.queryClient.ensureQueryData(matchesQuery);
		return { matches };
	},
	component: User,
});

function User() {
	const { playerId } = Route.useParams();
	const res = usePlayerInfo(playerId);
	const [_, setKDR] = useState<number>(1);
	useEffect(() => {
		if (res != null && res.exists) {
			let total_kills = 0;
			let total_deaths = 0;
			for (let i = 0; i < res.performances.length; i++) {
				total_kills += res.performances[i].kills;
				total_deaths += res.performances[i].deaths;
			}
			setKDR(total_kills / total_deaths);
		}
	}, [res]);
	return (
		<div className="w-full h-full flex flex-col space-y-2">
			{res == null ? (
				<div className="flex flex-col items-center">
					<Spinner className="size-16" />
					<div className="w-full text-center h-full">Loading...</div>
				</div>
			) : res.exists ? (
				<>
					<Card className="ring-sidebar-border rounded-lg">
						<CardHeader>
							<CardTitle className="flex flex-row items-center space-x-2 text-lg">
								<MinecraftAvatar uuid={res.uuid} /> <span>{res.name}</span>
							</CardTitle>
						</CardHeader>
						<CardContent className="text-sm flex flex-row space-x-3 flex-wrap">
							{/* <div>
								<span className="font-bold">69</span>
								<span className="text-accent-foreground/50"> games played</span>
							</div>
							<span className="font-extrabold">•</span>
							<div>
								<span className="font-bold">69</span>
								<span className="text-accent-foreground/50"> games won</span>
							</div>
							<span className="font-extrabold">•</span>
							<div>
								<span className="font-bold">0</span>
								<span className="text-accent-foreground/50"> games lost</span>
							</div>
							<span className="font-extrabold">•</span>
							<div>
								<span className="font-bold">0</span>
								<span className="text-accent-foreground/50"> games forfeited</span>
							</div>
							<span className="font-extrabold">•</span>
							<div>
								<span className="font-bold">80</span>
								<span className="text-accent-foreground/50">% winrate</span>
							</div>
							<span className="font-extrabold">•</span>
							<div>
								<span className="text-accent-foreground/50">kdr </span>
								<span className="font-bold">{Math.round(kdr * 100) / 100}</span>
							</div> */}
						</CardContent>
					</Card>

					<Card className="ring-sidebar-border rounded-lg flex-1">
						<CardHeader>
							<CardTitle>Performances</CardTitle>
						</CardHeader>
						<CardContent>
							<PlayerPerformancesList player={res} />
						</CardContent>
					</Card>
				</>
			) : (
				<div className="flex flex-col items-center">
					<div className="text-red-400 w-full text-center h-full">Player Not Found</div>
					<div>{playerId}</div>
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
