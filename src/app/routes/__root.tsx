import { createRootRouteWithContext, Outlet } from "@tanstack/react-router";
import { QueryClient } from "@tanstack/react-query";
import Layout from "../layout";
import { Button } from "@/components/ui/button";
import { router } from "../router";

export const Route = createRootRouteWithContext<{
	queryClient: QueryClient;
}>()({
	component: Root,
	notFoundComponent: (info) => {
		return (
			<div className="flex flex-col items-center">
				<div className="text-red-400 w-full text-center h-full">Not Found</div>
				<div>{info.routeId}</div>
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
	},
	errorComponent: (info) => {
		return (
			<Layout>
				<div className="flex flex-col items-center">
					<div className="text-red-400 w-full text-center h-full">Error</div>
					<div>{info.error.message}</div>
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
			</Layout>
		);
	},
});

function Root() {
	return (
		<>
			<Layout>
				<Outlet />
			</Layout>
		</>
	);
}
