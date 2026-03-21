import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { LayoutSidebar } from "./components/layout/sidebar";

import AccountIntroDialog from "./components/account-intro-dialog";
import { TooltipProvider } from "@/components/ui/tooltip";

export default function Layout({ children }: { children: React.ReactNode }) {
	return (
		<div className="[--header-height:calc(--spacing(14))]">
			<TooltipProvider>
				<SidebarProvider className="flex flex-col">
					<div className="flex flex-1">
						<LayoutSidebar />

						<SidebarInset className={"p-2 h-screen pl-0"}>{children}</SidebarInset>

						<AccountIntroDialog />
					</div>
				</SidebarProvider>
			</TooltipProvider>
		</div>
	);
}
