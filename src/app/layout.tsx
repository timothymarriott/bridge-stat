import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { LayoutSidebar } from "./components/layout/sidebar";

import AccountIntroDialog from "./components/account-intro-dialog";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useIsMobile } from "@/lib/use-mobile";
import SidebarToggle from "./components/layout/sidebar-toggle";
import { useAuth } from "./auth-hooks";
import MinecraftAvatar from "./components/mc-avatar";

export default function Layout({ children }: { children: React.ReactNode }) {
	const isMobile = useIsMobile();

	const auth = useAuth();

	return (
		<div className="[--header-height:calc(--spacing(14))]">
			<TooltipProvider>
				<SidebarProvider className="flex flex-col">
					{isMobile ? (
						<div className="flex h-(--header-height) w-full items-center gap-2 px-4"></div>
					) : (
						<></>
					)}
					<div className="flex flex-1">
						<LayoutSidebar />
						{isMobile ? (
							<SidebarInset className={"p-2 h-screen space-y-2"}>
								<div className="w-full h-8 flex flex-row space-x-2">
									<SidebarToggle />
									<div className="flex-1 size-8 bg-card text-card-foreground rounded-lg ring-1 flex flex-row p-1 space-x-2 ring-sidebar-border items-center">
										{auth.exists ? (
											<>
												{auth.uuid ? (
													<MinecraftAvatar
														size="size-6"
														uuid={auth.uuid}
													/>
												) : null}
												<span>{auth.username ?? auth.name}</span>
											</>
										) : (
											<>Signed Out</>
										)}
									</div>
								</div>
								<div className="w-full h-full">{children}</div>
							</SidebarInset>
						) : (
							<SidebarInset className={"p-2 h-screen pl-0"}>{children}</SidebarInset>
						)}
						<AccountIntroDialog />
					</div>
				</SidebarProvider>
			</TooltipProvider>
		</div>
	);
}
