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
import { HomeIcon, PlusIcon } from "lucide-react";
import { router } from "@/app/router";
import { OptionalPlayerInformation } from "@/worker/types";
import { playersQuery } from "@/app/queries";
import MinecraftAvatar from "../mc-avatar";
import SubmitMatchDialog from "../submit-match-dialog";
import { useQueryData } from "@/app/auth-hooks";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";

export function LayoutSidebar() {
	const player_list: OptionalPlayerInformation[] | null = useQueryData(playersQuery);

	return (
		<Sidebar collapsible="icon" variant="floating">
			<SidebarHeader></SidebarHeader>
			<SidebarContent>
				<SidebarGroup>
					{player_list != null ? (
						player_list.map((player) => {
							if (!player.exists) return null;
							return (
								<SidebarMenuButton
									key={player.id}
									onClick={() => {
										router.navigate({
											to: "/player/" + player.id,
										});
									}}
									className="font-bold"
								>
									<MinecraftAvatar size="size-6" uuid={player.uuid} />
									{player.name}
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
				<SubmitMatchDialog>
					<SidebarMenuButton>
						<PlusIcon /> Add Match
					</SidebarMenuButton>
				</SubmitMatchDialog>
				<SidebarUser></SidebarUser>
			</SidebarFooter>
		</Sidebar>
	);
}
