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
import { OptionalPlayerInformation } from "@/worker/types";
import { matchesQuery, playersQuery } from "@/app/queries";
import MinecraftAvatar from "../mc-avatar";
import { useQueryData } from "@/app/auth-hooks";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { CalculateElos } from "@/lib/stats";
import { useEffect, useState } from "react";

export function LayoutSidebar() {
	const player_list: OptionalPlayerInformation[] | null = useQueryData(playersQuery);
	const matches = useQueryData(matchesQuery, {});

	const [elos, setElos] = useState<Record<string, number>>({});

	useEffect(() => {
		if (player_list != null) setElos(CalculateElos(player_list, Object.values(matches)));
	}, [matches]);

	return (
		<Sidebar collapsible="icon" variant="floating">
			<SidebarHeader></SidebarHeader>
			<SidebarContent>
				<SidebarGroup>
					{player_list != null ? (
						player_list
							.sort((a, b) => {
								if (!a.exists || !b.exists) return 0;
								if (elos[b.id] == undefined) return -1;
								if (elos[a.id] == undefined) return 1;
								return elos[b.id] - elos[a.id];
							})
							.map((player) => {
								if (!player.exists) return null;
								return (
									<SidebarMenuButton
										key={player.id}
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
											{elos[player.id] != undefined ? (
												<span className="text-accent-foreground">
													{Math.floor(elos[player.id]).toString()}
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
