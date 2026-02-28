import { PlayerInformation, Team } from "@/worker/types";
import { useQueryData } from "../auth-hooks";
import { matchesQuery, playersQuery } from "../queries";
import MinecraftAvatar from "./mc-avatar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export default function PlayerPerformancesList({ player }: { player: PlayerInformation }) {
	const matches = useQueryData(matchesQuery);
	const players = useQueryData(playersQuery, []);

	return (
		<div className="space-y-1">
			{matches != null &&
				player.performances.map((perf, i) => {
					if (perf.match == null) return null;

					const match = matches[perf.match];

					console.log(match.id, match.winner, perf.team);
					console.log(perf.team);

					let red_scores = 0;
					let blue_scores = 0;

					for (const info of [...match.blue_players, ...match.red_players]) {
						if (info.team == Team.RED) {
							red_scores += info.scores;
						} else {
							blue_scores += info.scores;
						}
					}

					let winner: Team = Team.RED;

					if (red_scores == 5) {
						winner = Team.RED;
					} else if (blue_scores == 5) {
						winner = Team.BLUE;
					}

					function TeamInfo({ team, side }: { team: Team; side: "left" | "right" }) {
						const performances =
							team == Team.RED ? match.red_players : match.blue_players;
						return (
							<div
								className={
									"h-full flex text-center " +
									(side == "left" ? "flex-row" : "flex-row-reverse") +
									" rounded-sm space-x-1 "
								}
							>
								<div
									className={
										"grid grid-cols-4 rounded-sm p-1 space-x-1 " +
										(side == "right" ? "items-end [direction:rtl] " : "") +
										(team == Team.RED ? "bg-red-500/80" : "bg-blue-600/80")
									}
								>
									{performances.map((p) => {
										const player = players.find((_p) => {
											if (!_p.exists || !_p) return false;
											return _p.id == p.user;
										});
										if (player == undefined || !player.exists) return null;
										return (
											<MinecraftAvatar
												size="size-5"
												uuid={player.uuid}
												tooltip={
													<>
														<span>{player.username ?? ""}</span> <br />
														<span>Goals: {p.scores}</span> <br />
														<span>Kills: {p.kills}</span> <br />
														<span>Deaths: {p.deaths}</span> <br />
														<span>Voids: {p.voids}</span>
													</>
												}
											/>
										);
									})}
								</div>
								<div className="h-full flex flex-row space-x-3 ">
									<div className="text-center flex space-x-1 items-center">
										<span className="font-bold">
											<span>
												{team == Team.RED ? red_scores : blue_scores}
											</span>
										</span>
										<span className="text-accent-foreground/80 font-bold">
											{" "}
											goals
										</span>
									</div>
									{/* <span className="font-extrabold">•</span> */}
								</div>
							</div>
						);
					}

					return (
						<div
							className={
								"justify-between grid grid-cols-3 rounded-sm items-center " +
								(i % 2 == 0 ? "bg-sidebar-accent/40" : "")
							}
						>
							{perf.team == Team.RED ? (
								<TeamInfo team={Team.RED} side="left" />
							) : (
								<TeamInfo team={Team.BLUE} side="left" />
							)}

							<div className="text-center grid grid-cols-2">
								{winner == perf.team ? (
									<span className="text-green-400">Won</span>
								) : (
									<span className="text-red-400">Lost</span>
								)}
								<Tooltip disableHoverableContent>
									<TooltipTrigger>
										<span>{match.map}</span>
									</TooltipTrigger>
									<TooltipContent>
										<img src={"/Maps/Blue/" + match.map + ".png"} />
									</TooltipContent>
								</Tooltip>
							</div>
							{perf.team == Team.RED ? (
								<TeamInfo team={Team.BLUE} side="right" />
							) : (
								<TeamInfo team={Team.RED} side="right" />
							)}
						</div>
					);
				})}
		</div>
	);
}
