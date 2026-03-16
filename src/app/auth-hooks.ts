import { useQuery, UseQueryOptions } from "@tanstack/react-query";
import { api_client, authQuery } from "./queries";
import {
	OptionalPlayerInformation,
	OptionalUserInformation,
	PlayerInformation,
} from "@/worker/types";
import { queryClient, router } from "./router";
import { createAuthClient } from "better-auth/react";

export function useAuth(): OptionalUserInformation {
	const profile = useQueryData(authQuery, {
		exists: false,
	});

	return profile;
}

export function useIsAuthLoading(): boolean {
	const profile = useQueryData(authQuery);

	return profile == null;
}

const auth = createAuthClient({
	baseURL: import.meta.env.PROD
		? "https://bridge-stat.timothyrmarriott.workers.dev"
		: "http://localhost:5173",
});

export function useBetterAuth() {
	return auth;
}

export function usePlayerInfo(username: string) {
	const player = useQueryData({
		queryKey: ["todos", username],
		staleTime: 60 * 5 * 1000,
		queryFn: async (): Promise<OptionalPlayerInformation> => {
			const data = await api_client.api.player.info[":username"].$get({
				param: {
					username: username,
				},
			});
			if (!data.ok) {
				await router.navigate({
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

	return player;
}

export async function dirtyQueryData<TData>(options: UseQueryOptions<TData>) {
	await queryClient.refetchQueries(options);
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
