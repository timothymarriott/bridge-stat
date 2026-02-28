import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { LayoutSidebar } from "./components/layout/sidebar";

import AccountIntroDialog from "./components/account-intro-dialog";
import { TooltipProvider } from "@/components/ui/tooltip";

export default function Layout({ children }: { children: React.ReactNode }) {
	return (
		<SidebarProvider>
			<TooltipProvider>
				<LayoutSidebar />
				<SidebarInset className="p-2 pl-0 h-full">{children}</SidebarInset>
				<AccountIntroDialog />
			</TooltipProvider>
		</SidebarProvider>
	);
}
