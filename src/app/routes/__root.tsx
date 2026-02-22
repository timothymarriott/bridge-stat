import { createRootRouteWithContext, Outlet } from "@tanstack/react-router";
import { QueryClient } from "@tanstack/react-query";
import Layout from "../layout";
import { Button } from "@/components/ui/button";
import { router } from "../router";
import { profileQuery, authQuery } from "../queries";

export const Route = createRootRouteWithContext<{
	queryClient: QueryClient;
}>()({
	beforeLoad: async ({ context }) => {
		const profile = await context.queryClient.ensureQueryData(profileQuery);
		const auth = await context.queryClient.ensureQueryData(authQuery);

		return { profile, auth };
	},
	component: Root,
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
