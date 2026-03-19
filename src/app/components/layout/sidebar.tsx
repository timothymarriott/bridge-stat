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
import { useState } from "react";

export function LayoutSidebar() {
	const data = useQueryData(playersQuery, {
		players: [],
		matches: null,
	});
	// Hide players that have no recorded match performances.
	// Previously they were rendered but `disabled`, which made them appear grayed out.
	const player_list =
		data.players.length == 0
			? null
			: data.players.filter((p) => p.exists && p.performances.length > 0);
	const matches = data.matches;

	const [elos, setElos] = useState<EloInformation | null>(null);

	if (player_list != null && matches != null && elos == null) {
		const vs = CalculateElos(player_list, Object.values(matches));
		setElos(vs);
	}

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
								if (elos.counts[a.id] == undefined) return Infinity;
								if (elos.counts[b.id] == undefined) return -Infinity;
								return elos.finalScores[b.id].mu - elos.finalScores[a.id].mu;
							})
							.map((player) => {
								if (!player.exists) return null;
								return (
									<SidebarMenuButton
										key={player.id}
										disabled={
											elos ? elos.counts[player.id] == undefined : false
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
											{elos?.finalScores[player.id] != undefined ? (
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
