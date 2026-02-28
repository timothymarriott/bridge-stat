import { useQuery, UseQueryOptions } from "@tanstack/react-query";
import { api_client, authQuery, betterAuthQuery } from "./queries";
import {
	OptionalPlayerInformation,
	OptionalUserInformation,
	PlayerInformation,
} from "@/worker/types";
import { router } from "./router";

export function useAuth(): OptionalUserInformation {
	const profile = useQueryData(authQuery, {
		exists: false,
	});

	return profile;
}

export function isAuthLoading(): boolean {
	const profile = useQueryData(authQuery);

	return profile == null;
}

export function useBetterAuth() {
	return useQueryData(betterAuthQuery)!;
}

export function usePlayerInfo(username: string) {
	return useQueryData({
		queryKey: ["todos", username],
		staleTime: 60 * 5 * 1000,
		queryFn: async (): Promise<OptionalPlayerInformation> => {
			const data = await api_client.api.player.info[":username"].$get({
				param: {
					username: username,
				},
			});
			if (!data.ok) {
				router.navigate({
					to: "/",
				});
				return {
					exists: false,
				};
			}
			const user = await (data.json() as Promise<PlayerInformation>);

			return {
				exists: true,
				...user,
			};
		},
	});
}

export function useQueryData<TData>(options: UseQueryOptions<TData>): TData | null;

export function useQueryData<TData>(
	options: UseQueryOptions<TData>,
	fallback: TData,
): NonNullable<TData>;

export function useQueryData<TData>(options: UseQueryOptions<TData>, fallback?: TData) {
	const res = useQuery(options);

	if (res.data == undefined) {
		if (fallback != undefined) {
			return fallback;
		} else {
			return null;
		}
	}
	return res.data;
}

export function createQuery<TData>(options: UseQueryOptions<TData>): UseQueryOptions<TData> {
	return options;
}
