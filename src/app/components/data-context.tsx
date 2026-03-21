import { ReactNode, useMemo } from "react";
import { DataContext } from "./data-hook";
import {
	Match,
	OptionalPlayerInformation,
	PlayerInformation,
	PlayerPerformance,
} from "@/worker/types";
import { dataQuery } from "../queries";
import { EloInformation } from "@/lib/stats";
import { useQuery } from "@tanstack/react-query";

export interface DataContextType {
	matches: Match[] | null;
	matchesMap: Record<string, Match>;
	players: PlayerInformation[];
	elos: EloInformation | null;
	usePlayerData: (username: string) => OptionalPlayerInformation | null;
}

export const DataProvider = ({ children }: { children: ReactNode }) => {
	const query = useQuery(dataQuery);
	const data = query.data;
	const value = useMemo<DataContextType>(() => {
		const matches = data?.matches ?? null;
		const players = data?.players.filter((p) => p.exists) ?? [];
		const matchesMap: Record<string, Match> = {};
		matches?.forEach((m) => (matchesMap[m.id] = m));

		players.forEach((p, i) => {
			const perfs: PlayerPerformance[] = [];
			matches?.forEach((m) => {
				perfs.push(
					...[...m.red_players, ...m.blue_players].filter((perf) => perf.user == p.id),
				);
			});

			players[i] = {
				...p,
				performances: perfs,
			};
		});

		return {
			matches,
			players,
			matchesMap,
			elos: data?.elos ?? null,
			usePlayerData: (username) => {
				return (
					players.find((p) => p.username == username) ?? {
						exists: false,
					}
				);
			},
		};
	}, [data]);

	return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};
