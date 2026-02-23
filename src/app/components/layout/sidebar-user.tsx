"use client";

import { LayoutDashboardIcon, LogOut } from "lucide-react";
import { SiDiscord, SiGithub, SiGoogle } from "@icons-pack/react-simple-icons";
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
import { useBetterAuth, useAuth as useAuth } from "@/app/auth-hooks";
import { queryClient, router } from "@/app/router";
import MinecraftAvatar from "../mc-avatar";
import { proxy } from "@/lib/utils";
import { authQuery } from "@/app/queries";

export function SidebarUser() {
	const auth = useAuth();

	const better_auth = useBetterAuth();

	const sidebar = useSidebar();

	return sidebar.open ? (
		<SidebarMenu>
			<SidebarMenuItem>
				{auth.isLoggedIn ? (
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<SidebarMenuButton
								size="lg"
								className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
							>
								{auth.user.uuid == null ? (
									<>
										<Avatar className="h-8 w-8 rounded-lg">
											<AvatarImage
												src={proxy(auth.user.image ?? "")}
												alt={auth.user.name}
											/>
										</Avatar>
										<div className="grid flex-1 text-left text-sm leading-tight">
											<span className="truncate font-medium">
												{auth.user.name}
											</span>
											<span className="truncate text-xs">
												{auth.user.email}
											</span>
										</div>
									</>
								) : (
									<>
										<MinecraftAvatar uuid={auth.user.uuid} />
										<div className="grid flex-1 text-left text-sm leading-tight">
											<span className="truncate font-bold">
												{auth.user.username ?? auth.user.name}
											</span>
											<span className="truncate text-xs">
												{auth.user.email}
											</span>
										</div>
									</>
								)}
							</SidebarMenuButton>
						</DropdownMenuTrigger>
						<DropdownMenuContent
							className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
							side={sidebar.isMobile ? "bottom" : "right"}
							align="end"
							sideOffset={4}
						>
							<DropdownMenuLabel className="p-0 font-normal">
								<div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
									<Avatar className="h-8 w-8 rounded-lg">
										<AvatarImage
											src={proxy(auth.user.image ?? "")}
											alt={auth.user.name}
										/>
									</Avatar>
									<div className="grid flex-1 text-left text-sm leading-tight">
										<span className="truncate font-medium">
											{auth.user.name}
										</span>
										<span className="truncate text-xs">{auth.user.email}</span>
									</div>
								</div>
							</DropdownMenuLabel>
							<DropdownMenuSeparator />

							{(auth.user.is_admin ?? 0 > 0) ? (
								<>
									<DropdownMenuItem
										onClick={() => {
											router.navigate({
												to: "/admin",
											});
										}}
									>
										<LayoutDashboardIcon />
										Admin Dashboard
									</DropdownMenuItem>
									<DropdownMenuSeparator />
								</>
							) : (
								<></>
							)}

							<DropdownMenuItem
								variant="destructive"
								onClick={async () => {
									await better_auth.signOut();
									router.navigate({
										to: "/",
									});
									await queryClient.refetchQueries(authQuery);
								}}
							>
								<LogOut />
								Log out
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				) : (
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button variant={"secondary"} className="w-full h-12">
								Login
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent>
							<DropdownMenuItem
								onClick={() => {
									better_auth.signIn.social({
										provider: "discord",
									});
								}}
							>
								<SiDiscord /> Discord
							</DropdownMenuItem>
							<DropdownMenuItem
								onClick={() => {
									better_auth.signIn.social({
										provider: "github",
									});
								}}
							>
								<SiGithub /> Github
							</DropdownMenuItem>
							<DropdownMenuItem
								onClick={() => {
									better_auth.signIn.social({
										provider: "google",
									});
								}}
							>
								<SiGoogle /> Google
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				)}
			</SidebarMenuItem>
		</SidebarMenu>
	) : (
		<></>
	);
}
