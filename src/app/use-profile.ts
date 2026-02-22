import { useQuery } from "@tanstack/react-query";
import { authQuery, profileQuery } from "./queries";

export function useProfile() {
	const profile = useQuery(profileQuery);

	return profile.data;
}

export function useAuth() {
	const auth = useQuery(authQuery);

	return auth.data!;
}
