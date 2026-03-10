"use client";

import {
	CloudIcon,
	GitCommitIcon,
	LayoutDashboardIcon,
	LogOut,
	MonitorIcon,
	UploadIcon,
} from "lucide-react";
import { SiDiscord, SiGoogle } from "@icons-pack/react-simple-icons";
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
import { useBetterAuth, useAuth as useAuth, isAuthLoading } from "@/app/auth-hooks";
import { queryClient, router } from "@/app/router";
import MinecraftAvatar from "../mc-avatar";
import { proxy } from "@/lib/utils";
import { authQuery } from "@/app/queries";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import UploadMatchDialog from "../upload-match-dialog";
import { DialogTrigger } from "@/components/ui/dialog";
import { useNative } from "@/app/native/hooks";

export function SidebarUser() {
	const auth = useAuth();

	const is_auth_loading = isAuthLoading();

	const better_auth = useBetterAuth();

	const sidebar = useSidebar();

	const native = useNative();

	return sidebar.open ? (
		<SidebarMenu>
			<SidebarMenuItem>
				{auth.exists ? (
					<UploadMatchDialog>
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<SidebarMenuButton
									size="lg"
									className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
								>
									{auth.uuid == null ? (
										<>
											<Avatar className="h-8 w-8 rounded-lg">
												<AvatarImage
													src={proxy(auth.image ?? "")}
													alt={auth.name}
												/>
											</Avatar>
											<div className="grid flex-1 text-left text-sm leading-tight">
												<span className="truncate font-medium">
													{auth.name}
												</span>
												<span className="truncate text-xs">
													{auth.email}
												</span>
											</div>
										</>
									) : (
										<>
											<MinecraftAvatar uuid={auth.uuid} />
											<div className="grid flex-1 text-left text-sm leading-tight">
												<span className="truncate font-bold">
													{auth.username ?? auth.name}
												</span>
												<span className="truncate text-xs">
													{auth.email}
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
												src={proxy(auth.image ?? "")}
												alt={auth.name}
											/>
										</Avatar>
										<div className="grid flex-1 text-left text-sm leading-tight">
											<span className="truncate font-medium">
												{auth.name}
											</span>
											<span className="truncate text-xs">{auth.email}</span>
										</div>
									</div>
								</DropdownMenuLabel>
								<DropdownMenuSeparator />

								<DropdownMenuLabel className="min-h-7 gap-2 rounded-md px-2 py-1 text-xs/relaxed data-inset:pl-7.5 [&_svg:not([class*='size-'])]:size-3.5 group/dropdown-menu-item relative flex cursor-default items-center outline-hidden select-none data-disabled:pointer-events-none data-disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0">
									{native.isNative ? (
										<>
											<MonitorIcon />
											<span>Native</span>
										</>
									) : (
										<>
											<CloudIcon />
											<span>Web</span>
										</>
									)}
								</DropdownMenuLabel>

								<DropdownMenuSeparator />

								{(auth.is_admin ?? 0 > 0) ? (
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

										<DialogTrigger asChild>
											<DropdownMenuItem>
												<UploadIcon />
												Upload Match
											</DropdownMenuItem>
										</DialogTrigger>

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
					</UploadMatchDialog>
				) : is_auth_loading ? (
					<Skeleton className="w-full h-12">
						<Button variant={"secondary"} disabled={true} className="w-full h-12">
							<Spinner data-icon="inline-start" />
							Loading...
						</Button>
					</Skeleton>
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
