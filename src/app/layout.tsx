import { SidebarProvider } from "@/components/ui/sidebar";
import { LayoutSidebar } from "./components/layout/sidebar";
import { createAuthClient } from "better-auth/react";

import { useAuth, useProfile } from "./use-profile";

import AccountIntroDialog from "./components/account-intro-dialog";

export default function Layout({ children }: { children: React.ReactNode }) {
	const auth = useAuth();
	const session = auth.useSession();
	const profile = useProfile();

	return (
		<SidebarProvider>
			<LayoutSidebar />
			<main className="p-2 pl-0 w-full h-full">{children}</main>
			<AccountIntroDialog />
		</SidebarProvider>
	);
}
