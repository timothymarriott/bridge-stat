import { createFileRoute } from "@tanstack/react-router";
import { authQuery } from "../queries";
import LinkRequestList from "../components/link-request-list";
import UserList from "../components/user-list";
import { useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FullMatchInsertData } from "@/worker/types";

export const Route = createFileRoute("/admin")({
	beforeLoad: async ({ context }) => {
		const auth = await context.queryClient.ensureQueryData(authQuery);

		if (!auth.exists) {
			throw Error("Access Denied");
		}

		if (auth.is_admin == 0) {
			throw Error("Access Denied");
		}

		return { auth };
	},

	component: Admin,
});

export function Admin() {
	const inputref = useRef<HTMLInputElement>(null);
	return (
		<div className="space-y-2">
			<UserList />
			<LinkRequestList />

			<Input ref={inputref}></Input>
			<Button
				onClick={async () => {
					if (!inputref.current) return;
					const data: FullMatchInsertData[] = JSON.parse(inputref.current.value);
					for (const element of data) {
						await fetch("/api/admin/upload", {
							credentials: "include",
							method: "POST",
							body: JSON.stringify(element),
						});
					}
				}}
			>
				Upload
			</Button>
		</div>
	);
}
