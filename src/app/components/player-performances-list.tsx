import { PlayerInformation, Team } from "@/worker/types";
import { useQueryData } from "../auth-hooks";
import { matchesQuery, playersQuery } from "../queries";
import MinecraftAvatar from "./mc-avatar";

export default function PlayerPerformancesList({ player }: { player: PlayerInformation }) {
	const matches = useQueryData(matchesQuery);
	const players = useQueryData(playersQuery, []);
	return (
		<div className="space-y-1">
			{matches != null &&
				player.performances.map((perf) => {
					if (perf.match == null) return null;

					const match = matches[perf.match];

					return (
						<div className="justify-between grid grid-cols-3 rounded-sm">
							<div className={"h-full grid p-1 grid-cols-2 rounded-sm bg-red-500/80"}>
								<div className="flex flex-row space-x-1">
									{match.red_players.map((p) => {
										const player = players.find((_p) => {
											if (!_p.exists) return false;
											return _p.id == p;
										});
										if (player == undefined || !player.exists) return null;
										return <MinecraftAvatar size="size-5" uuid={player.uuid} />;
									})}
								</div>
								<span>{match.red_scores}</span>
							</div>
							<div className="">
								{match.winner == perf.team ? (
									<span className="text-green-400">Won</span>
								) : (
									<span className="text-red-400">Lost</span>
								)}
							</div>
							<div
								className={"h-full p-1 grid grid-cols-2 rounded-sm bg-blue-500/80"}
							>
								<span>{match.blue_scores}</span>
								<div className="flex flex-row space-x-1 justify-end">
									{match.blue_players.map((p) => {
										const player = players.find((_p) => {
											if (!_p.exists) return false;
											return _p.id == p;
										});
										if (player == undefined || !player.exists) return null;
										return <MinecraftAvatar size="size-5" uuid={player.uuid} />;
									})}
								</div>
							</div>
						</div>
					);
				})}
		</div>
	);
}
