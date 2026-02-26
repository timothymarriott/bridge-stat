import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ReactNode, useState } from "react";
import { MatchSumbitdata, PlayerInformation, Team } from "@/worker/types";
import { playersQuery } from "../queries";
import { useQuery } from "@tanstack/react-query";
import { MinusIcon, PlusIcon } from "lucide-react";

export default function SubmitMatchDialog({ children }: { children: ReactNode }) {
	const players_query = useQuery(playersQuery);

	const player_list = players_query.data ?? [];

	const [red_players, setRedPlayers] = useState<PlayerInformation[]>([]);
	const [blue_players, setBluePlayers] = useState<PlayerInformation[]>([]);

	function RemovePlayer(player: PlayerInformation) {
		setRedPlayers((old) => {
			return old.filter((p) => {
				return p.id != player.id;
			});
		});

		setBluePlayers((old) => {
			return old.filter((p) => {
				return p.id != player.id;
			});
		});
	}

	function AddRedPlayer(player: PlayerInformation) {
		if (
			red_players.find((p) => {
				return p.id == player.id;
			}) != undefined
		) {
			return;
		}
		setRedPlayers((old) => {
			return [...old, player];
		});
	}
	function AddBluePlayer(player: PlayerInformation) {
		if (
			blue_players.find((p) => {
				return p.id == player.id;
			}) != undefined
		) {
			return;
		}
		setBluePlayers((old) => {
			return [...old, player];
		});
	}

	function IsInRed(player: PlayerInformation) {
		return (
			red_players.find((p) => {
				return p.id == player.id;
			}) != undefined
		);
	}

	function IsInBlue(player: PlayerInformation) {
		return (
			blue_players.find((p) => {
				return p.id == player.id;
			}) != undefined
		);
	}

	return (
		<Dialog>
			<DialogTrigger asChild>{children}</DialogTrigger>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>Submit Match</DialogTitle>
					<DialogDescription>Enter the details of the match below.</DialogDescription>
				</DialogHeader>
				<div className="flex items-center flex-col gap-2">
					{player_list.map((p) => {
						if (!p.exists) {
							return null;
						}
						return (
							<div
								key={p.id}
								className="flex-1 gap-2 flex flex-row justify-between w-full"
							>
								<span
									className={
										"font-bold " +
										(IsInRed(p)
											? "text-red-500"
											: IsInBlue(p)
												? "text-blue-500"
												: "")
									}
								>
									{p.username}
								</span>
								<div className="w-min flex flex-row">
									<Button
										variant={"secondary"}
										className="bg-red-500 w-8 hover:bg-red-600"
										disabled={IsInRed(p) || IsInBlue(p)}
										onClick={async () => {
											AddRedPlayer(p);
										}}
									>
										<PlusIcon />
									</Button>

									<Button
										variant={"secondary"}
										className="bg-blue-500 w-8 hover:bg-blue-600"
										disabled={IsInRed(p) || IsInBlue(p)}
										onClick={async () => {
											AddBluePlayer(p);
										}}
									>
										<PlusIcon />
									</Button>
									<Button
										variant={"secondary"}
										disabled={!(IsInRed(p) || IsInBlue(p))}
										onClick={async () => {
											RemovePlayer(p);
										}}
									>
										<MinusIcon />
									</Button>
								</div>
							</div>
						);
					})}
				</div>

				<DialogFooter className="sm:justify-start">
					<DialogClose asChild>
						<Button
							type="button"
							onClick={async () => {
								const winner = Math.random() >= 0.5 ? Team.RED : Team.BLUE;
								const data: MatchSumbitdata = {
									winner,
									red_scores:
										winner == Team.RED ? 5 : Math.floor(Math.random() * 4),
									blue_scores:
										winner == Team.BLUE ? 5 : Math.floor(Math.random() * 4),
									duration: 300 + Math.random() * 600,
									red_players: red_players.map((p) => p.id),
									blue_players: blue_players.map((p) => p.id),
								};
							}}
						>
							Submit
						</Button>
					</DialogClose>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
