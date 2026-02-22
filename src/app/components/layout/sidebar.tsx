import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarHeader,
	SidebarMenuButton,
} from "@/components/ui/sidebar";
import { SidebarUser } from "./sidebar-user";
import { HomeIcon } from "lucide-react";
import { router } from "@/app/router";

export function LayoutSidebar() {
	return (
		<Sidebar collapsible="icon" variant="floating">
			<SidebarHeader></SidebarHeader>
			<SidebarContent>
				<SidebarGroup />
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
