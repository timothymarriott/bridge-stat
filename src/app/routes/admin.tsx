import { createFileRoute } from "@tanstack/react-router";
import { authQuery } from "../queries";
import LinkRequestList from "../components/link-request-list";
import UserList from "../components/user-list";

export const Route = createFileRoute("/admin")({
	beforeLoad: async ({ context }) => {
		const auth = await context.queryClient.ensureQueryData(authQuery);

		if (!auth.isLoggedIn) {
			throw Error("Access Denied");
		}

		if (auth.user.is_admin == 0) {
			throw Error("Access Denied");
		}

		return { auth };
	},

	component: Admin,
});

export function Admin() {
	return (
		<div className="space-y-2">
			<UserList />
			<LinkRequestList />
		</div>
	);
}
