import { SidebarProvider } from "@/components/ui/sidebar";
import { LayoutSidebar } from "./components/layout/sidebar";

import AccountIntroDialog from "./components/account-intro-dialog";

export default function Layout({ children }: { children: React.ReactNode }) {
	return (
		<SidebarProvider>
			<LayoutSidebar />
			<main className="p-2 pl-0 w-full h-full">{children}</main>
			<AccountIntroDialog />
		</SidebarProvider>
	);
}
