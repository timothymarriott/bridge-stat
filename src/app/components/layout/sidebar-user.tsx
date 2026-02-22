"use client";

import { LayoutDashboardIcon, LogOut } from "lucide-react";

import { Avatar, AvatarImage } from "@/components/ui/avatar";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { useAuth, useProfile } from "@/app/use-profile";
import { router } from "@/app/router";
import MinecraftAvatar from "../mc-avatar";

export function SidebarUser() {
	const { isMobile } = useSidebar();

	const auth = useAuth();

	const session = auth.useSession();

	const profile = useProfile();

	const sidebar = useSidebar();

	return sidebar.open ? (
		<SidebarMenu>
			<SidebarMenuItem>
				{session.data != null && profile != null ? (
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<SidebarMenuButton
								size="lg"
								className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
							>
								{profile.uuid == null ? (
									<>
										<Avatar className="h-8 w-8 rounded-lg">
											<AvatarImage
												src={session.data.user.image ?? ""}
												alt={session.data.user.name}
											/>
										</Avatar>
										<div className="grid flex-1 text-left text-sm leading-tight">
											<span className="truncate font-medium">
												{session.data.user.name}
											</span>
											<span className="truncate text-xs">
												{session.data.user.email}
											</span>
										</div>
									</>
								) : (
									<>
										<MinecraftAvatar uuid={profile.uuid} />
										<div className="grid flex-1 text-left text-sm leading-tight">
											<span className="truncate font-bold">
												{profile.username ?? session.data.user.name}
											</span>
											<span className="truncate text-xs">
												{session.data.user.email}
											</span>
										</div>
									</>
								)}
							</SidebarMenuButton>
						</DropdownMenuTrigger>
						<DropdownMenuContent
							className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
							side={isMobile ? "bottom" : "right"}
							align="end"
							sideOffset={4}
						>
							<DropdownMenuLabel className="p-0 font-normal">
								<div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
									<Avatar className="h-8 w-8 rounded-lg">
										<AvatarImage
											src={session.data.user.image ?? ""}
											alt={session.data.user.name}
										/>
									</Avatar>
									<div className="grid flex-1 text-left text-sm leading-tight">
										<span className="truncate font-medium">
											{session.data.user.name}
										</span>
										<span className="truncate text-xs">
											{session.data.user.email}
										</span>
									</div>
								</div>
							</DropdownMenuLabel>
							<DropdownMenuSeparator />

							{(profile?.is_admin ?? 0 > 0) ? (
								<DropdownMenuItem
									variant="destructive"
									onClick={() => {
										router.navigate({
											to: "/admin",
										});
									}}
								>
									<LayoutDashboardIcon />
									Admin Dashboard
								</DropdownMenuItem>
							) : (
								<></>
							)}
							<DropdownMenuItem
								variant="destructive"
								onClick={() => {
									auth.signOut();
									router.navigate({
										to: "/",
									});
								}}
							>
								<LogOut />
								Log out
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				) : (
					<Button
						onClick={() => {
							auth.signIn.social({
								provider: "discord",
							});
						}}
						variant={"secondary"}
						className="w-full h-12"
					>
						Login
					</Button>
				)}
			</SidebarMenuItem>
		</SidebarMenu>
	) : (
		<></>
	);
}
