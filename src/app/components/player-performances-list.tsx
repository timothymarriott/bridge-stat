import { PlayerInformation, Team } from "@/worker/types";
import { useQueryData } from "../auth-hooks";
import { matchesQuery, playersQuery } from "../queries";
import MinecraftAvatar from "./mc-avatar";

export default function PlayerPerformancesList({ player }: { player: PlayerInformation }) {
	const matches = useQueryData(matchesQuery);
	const players = useQueryData(playersQuery, []);
	return (
		<div>
			{matches != null &&
				player.performances.map((perf) => {
					if (perf.match == null) return null;

					const match = matches[perf.match];

					return (
						<div className="justify-between grid grid-cols-4">
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
							<span
								className={perf.team == Team.RED ? "text-red-500" : "text-blue-500"}
							>
								●
							</span>
							<span>{match.map}</span>
							<div className="flex flex-row-reverse space-x-1 justify-start">
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
					);
				})}
		</div>
	);
}
