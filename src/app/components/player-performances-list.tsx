import { PlayerInformation, Team } from "@/worker/types";
import { useQueryData } from "../auth-hooks";
import { matchesQuery, playersQuery } from "../queries";
import MinecraftAvatar from "./mc-avatar";
import {
	Popover,
	PopoverContent,
	PopoverDescription,
	PopoverHeader,
	PopoverTitle,
	PopoverTrigger,
} from "@/components/ui/popover";
import { useIsMobile } from "@/hooks/use-mobile";

export default function PlayerPerformancesList({ player }: { player: PlayerInformation }) {
	const matches = useQueryData(matchesQuery);
	const players = useQueryData(playersQuery, []);

	const isMobile = useIsMobile();

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
									" rounded-sm space-x-1"
								}
							>
								<div
									className={
										"grid grid-cols-3 rounded-sm p-1 space-x-1 " +
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
													isMobile ? undefined : (
														<>
															<span>{player.username ?? ""}</span>{" "}
															<br />
															<span>Goals: {p.scores}</span> <br />
															<span>Kills: {p.kills}</span> <br />
															<span>Deaths: {p.deaths}</span> <br />
															<span>Voids: {p.voids}</span>
														</>
													)
												}
											/>
										);
									})}
								</div>
							</div>
						);
					}

					return (
						<Popover>
							<PopoverTrigger asChild>
								<div
									className={
										"justify-between grid grid-cols-[auto_1fr_auto] rounded-sm items-center hover:bg-accent cursor-pointer " +
										(i % 2 == 0 ? "bg-sidebar-accent/40" : "")
									}
								>
									{perf.team == Team.RED ? (
										<TeamInfo team={Team.RED} side="left" />
									) : (
										<TeamInfo team={Team.BLUE} side="left" />
									)}

									<div
										className={
											"text-center grid " +
											(isMobile ? "grid-cols-3" : "grid-cols-4")
										}
									>
										<div>
											<span
												className={
													"font-bold " +
													(perf.team == Team.RED
														? "text-red-400"
														: "text-blue-400")
												}
											>
												{perf.team == Team.RED ? red_scores : blue_scores}
											</span>
											<span className="text-accent-foreground/50 font-bold">
												{" "}
												-{" "}
											</span>
											<span
												className={
													"font-bold " +
													(perf.team == Team.RED
														? "text-blue-400"
														: "text-red-400")
												}
											>
												{perf.team == Team.RED ? blue_scores : red_scores}
											</span>
										</div>
										<div className="flex flex-row items-center justify-center">
											<span className="font-bold">
												{Math.floor(match.duration / 60).toString()}
											</span>
											<span className="text-accent-foreground/50 font-bold">
												:
											</span>
											<span className="font-bold">
												{Math.floor(
													match.duration -
														Math.floor(match.duration / 60) * 60,
												)
													.toString()
													.padStart(2, "0")}
											</span>
										</div>
										{winner == perf.team ? (
											<span className="text-green-400">Won</span>
										) : (
											<span className="text-red-400">Lost</span>
										)}
										{isMobile ? null : (
											<span className="text-accent-foreground/50">
												{match.map}
											</span>
										)}
									</div>
									{perf.team == Team.RED ? (
										<TeamInfo team={Team.BLUE} side="right" />
									) : (
										<TeamInfo team={Team.RED} side="right" />
									)}
								</div>
							</PopoverTrigger>
							<PopoverContent>
								<PopoverHeader>
									<PopoverTitle>What a cool match.</PopoverTitle>
									<PopoverDescription>
										This will contain more info about the match.
										<img
											src={
												"/Maps/" +
												(perf.team == Team.RED ? "Red" : "Blue") +
												"/" +
												match.map +
												".png"
											}
											alt=""
										/>
									</PopoverDescription>
								</PopoverHeader>
							</PopoverContent>
						</Popover>
					);
				})}
		</div>
	);
}
