import { Button } from "@/components/ui/button";
import { createFileRoute } from "@tanstack/react-router";
import { router } from "../router";

export const Route = createFileRoute("/access-denied")({
	component: AccessDenied,
});

function AccessDenied() {
	return (
		<div className="flex flex-col items-center">
			<div className="text-red-400 w-full text-center h-full">Access Denied</div>
			<Button
				onClick={() => {
					router.navigate({
						to: "/",
					});
				}}
			>
				Return Home
			</Button>
		</div>
	);
}
