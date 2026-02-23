import { useQuery } from "@tanstack/react-query";
import { authQuery, betterAuthQuery } from "./queries";

export function useAuth() {
	const profile = useQuery(authQuery);

	return (
		profile.data ?? {
			isLoggedIn: false,
		}
	);
}

export function useBetterAuth() {
	const auth = useQuery(betterAuthQuery);

	return auth.data!;
}
