import { Button } from "@/components/ui/button";
import { useSidebar } from "@/components/ui/sidebar";
import { SidebarOpenIcon } from "lucide-react";

export default function SidebarToggle() {
	const sidebar = useSidebar();
	return (
		<Button
			variant={"secondary"}
			className="size-8 bg-card text-card-foreground rounded-lg ring-1 ring-sidebar-border"
			onClick={sidebar.toggleSidebar}
		>
			<SidebarOpenIcon className="size-4" />
		</Button>
	);
}
