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
import MinecraftAvatar from "../mc-avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { GetELO } from "@/lib/stats";

import { useData } from "../data-hook";

export function LayoutSidebar() {
	const data = useData();
	const player_list =
		data.players.length == 0 ? null : data.players.filter((p) => p.performances.length > 0);

	return (
		<Sidebar collapsible="icon" variant="floating">
			<SidebarHeader></SidebarHeader>
			<SidebarContent>
				<SidebarGroup>
					{player_list != null ? (
						player_list
							.sort((a, b) => {
								if (data.elos == null) return 0;
								if (data.elos.counts[a.id] == undefined) return Infinity;
								if (data.elos.counts[b.id] == undefined) return -Infinity;
								return (
									data.elos.finalScores[b.id].mu - data.elos.finalScores[a.id].mu
								);
							})
							.map((player) => {
								return (
									<SidebarMenuButton
										key={player.id}
										disabled={
											data.elos
												? data.elos.counts[player.id] == undefined
												: false
										}
										onClick={() => {
											void router.navigate({
												to: "/player/" + (player.username ?? ""),
											});
										}}
										className="font-bold"
									>
										<MinecraftAvatar size="size-6" uuid={player.uuid} />
										<div className="w-full justify-between flex flex-row">
											<span>{player.username}</span>
											{data.elos?.finalScores[player.id] != undefined ? (
												<span className="text-accent-foreground">
													{Math.floor(
														GetELO(data.elos.finalScores[player.id]),
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
						void router.navigate({
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
