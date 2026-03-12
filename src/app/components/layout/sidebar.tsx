import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarGroupLabel,
	SidebarHeader,
	SidebarMenuButton,
} from "@/components/ui/sidebar";
import { SidebarUser } from "./sidebar-user";
import { HomeIcon } from "lucide-react";
import { router } from "@/app/router";
import { playersQuery } from "@/app/queries";
import MinecraftAvatar from "../mc-avatar";
import { useQueryData } from "@/app/auth-hooks";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { CalculateElos, EloInformation, GetELO } from "@/lib/stats";
import { useEffect, useState } from "react";

export function LayoutSidebar() {
	const data = useQueryData(playersQuery, {
		players: [],
		matches: {},
	});
	const player_list = data.players;
	const matches = data.matches;

	const [elos, setElos] = useState<EloInformation | null>(null);

	useEffect(() => {
		if (player_list != null && matches != null)
			setElos(CalculateElos(player_list, Object.values(matches)));
	}, [matches, player_list]);

	return (
		<Sidebar collapsible="icon" variant="floating">
			<SidebarHeader></SidebarHeader>
			<SidebarContent>
				<SidebarGroup>
					{player_list != null ? (
						player_list
							.sort((a, b) => {
								if (!a.exists || !b.exists) return 0;
								if (elos == null) return 0;
								if (elos.finalScores[b.id] == undefined) return -1;
								if (elos.finalScores[a.id] == undefined) return 1;
								if (elos.counts[a.id] == undefined) return 1;
								if (elos.counts[b.id] == undefined) return -1;
								return elos.finalScores[b.id].mu - elos.finalScores[a.id].mu;
							})
							.map((player) => {
								if (!player.exists) return null;
								return (
									<SidebarMenuButton
										key={player.id}
										disabled={
											elos == null || elos.counts[player.id] == undefined
										}
										onClick={() => {
											router.navigate({
												to: "/player/" + player.username,
											});
										}}
										className="font-bold"
									>
										<MinecraftAvatar size="size-6" uuid={player.uuid} />
										<div className="w-full justify-between flex flex-row">
											<span>{player.username}</span>
											{elos != null &&
											elos.counts[player.id] != undefined &&
											elos.finalScores[player.id] != undefined ? (
												<span className="text-accent-foreground">
													{Math.floor(
														GetELO(elos.finalScores[player.id]),
													).toString()}
												</span>
											) : null}
										</div>
									</SidebarMenuButton>
								);
							})
					) : (
						<Skeleton>
							<SidebarGroupLabel className="space-x-1">
								<Spinner /> <span>Loading...</span>
							</SidebarGroupLabel>
						</Skeleton>
					)}
				</SidebarGroup>
				<SidebarGroup />
			</SidebarContent>
			<SidebarFooter>
				<SidebarMenuButton
					onClick={() => {
						router.navigate({
							to: "/",
						});
					}}
				>
					<HomeIcon /> Home
				</SidebarMenuButton>

				<SidebarUser></SidebarUser>
			</SidebarFooter>
		</Sidebar>
	);
}
