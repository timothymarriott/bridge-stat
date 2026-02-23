import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useRef, useState } from "react";
import MinecraftAvatar from "./mc-avatar";
import { MCProfileInfo } from "@/worker/types";
import { useAuth } from "../auth-hooks";
import { queryClient } from "../router";
import { authQuery } from "../queries";

export default function AccountIntroDialog() {
	const auth = useAuth();
	const [loading, setLoading] = useState<boolean>(false);
	let show_dialog =
		auth.isLoggedIn &&
		auth.user.uuid == null &&
		auth.user.awaiting_link_request == 0 &&
		!loading;

	const usernameInputRef = useRef<HTMLInputElement>(null);

	const [error, setError] = useState<string | null>(null);
	const [mcprofile, setMcProfile] = useState<MCProfileInfo | null>(null);

	return (
		<Dialog open={show_dialog}>
			<DialogContent className="sm:max-w-md" showCloseButton={false}>
				<DialogHeader>
					<DialogTitle>Welcome to bridge stats.</DialogTitle>
					<DialogDescription>
						You are yet to link your ingame account please enter your minecraft username
						below.
					</DialogDescription>
				</DialogHeader>
				<div className="flex items-center flex-col gap-2">
					<div className="flex-1 gap-2 flex flex-row w-full">
						<Label htmlFor="username" className="sr-only">
							Username
						</Label>
						<Input ref={usernameInputRef} id="username" type="text" />
						<Button
							variant={"secondary"}
							onClick={async () => {
								setMcProfile(null);
								const value = usernameInputRef.current?.value;
								if (value == undefined) {
									setError("Invalid username");
									return;
								}

								const res = await fetch(
									"https://mcprofile.io/api/v1/java/username/" +
										encodeURIComponent(value),
								);

								if (res.status == 404) {
									setError('User not found "' + value + '"');
									return;
								}

								if (!res.ok) {
									setError("Unknown error " + res.status.toString());
								}

								const data: MCProfileInfo =
									await (res.json() as Promise<MCProfileInfo>);

								setMcProfile(data);

								setError(null);
							}}
						>
							Search
						</Button>
					</div>

					{mcprofile != null ? (
						<>
							<div className="flex-1 gap-2 flex flex-row w-full size-10">
								<div className="size-10 p-1">
									<MinecraftAvatar uuid={mcprofile.uuid} />
								</div>
								<div className="flex flex-col justify-around align-middle">
									<p className=" font-bold">{mcprofile.username}</p>
									<p className=" text-xs text-muted-foreground">
										{mcprofile.uuid}
									</p>
								</div>
							</div>
						</>
					) : error == null ? null : (
						<>
							<p className="text-red-400">{error}</p>
						</>
					)}
				</div>
				{mcprofile != null ? (
					<>
						<p className="text-muted-foreground">
							After submitting an admin will review your request and link your
							account.
						</p>
						<DialogFooter className="sm:justify-start">
							<DialogClose asChild>
								<Button
									type="button"
									disabled={!show_dialog}
									onClick={async () => {
										setLoading(true);
										await fetch("/api/link/request/" + mcprofile.uuid, {
											credentials: "include",
											method: "POST",
										});
										await queryClient.refetchQueries(authQuery);
										setLoading(false);
									}}
								>
									Submit
								</Button>
							</DialogClose>
						</DialogFooter>
					</>
				) : null}
			</DialogContent>
		</Dialog>
	);
}
