import { Dialog, DialogContent, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Field, FieldLabel } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { ReactNode, useRef } from "react";
import Flashback from "../flashback";
import { FullMatchInsertData } from "@/worker/types";

export default function UploadMatchDialog({ children }: { children: ReactNode }) {
	const inputRef = useRef<HTMLInputElement>(null);

	return (
		<Dialog>
			{children}
			<DialogContent className="sm:max-w-md" showCloseButton={false}>
				<Field>
					<FieldLabel htmlFor={"file"}>File</FieldLabel>
					<Input
						ref={inputRef}
						multiple={true}
						name="file"
						type="file"
						accept=".zip,application/zip"
						placeholder="Upload File"
						autoComplete="off"
					/>
				</Field>
				<DialogFooter>
					<Field orientation="horizontal">
						<Button
							type="submit"
							onClick={async () => {
								if (
									inputRef.current &&
									inputRef.current.files &&
									inputRef.current.files.length > 0
								) {
									const matches: FullMatchInsertData[] = [];
									const files: File[] = [];
									for (const file of inputRef.current.files) {
										files.push(file);
									}

									await Promise.all(
										files.map(async (file) => {
											console.log(file);
											const flashback = new Flashback();
											const res = await flashback.findGames(
												await file.bytes(),
											);
											matches.push(...res);

											for (const match of res) {
												match.red_players.forEach((v) => {
													v.username = v.username
														.replace("JoeBartLover", "TheMoon021")
														.replace("Jordano120", "Tetron_");
												});

												match.blue_players.forEach((v) => {
													v.username = v.username
														.replace("JoeBartLover", "TheMoon021")
														.replace("Jordano120", "Tetron_");
												});
												await fetch("/api/admin/upload", {
													credentials: "include",
													method: "POST",
													body: JSON.stringify(match),
												});
											}
										}),
									);

									console.log(matches);
								}
							}}
						>
							Submit
						</Button>
					</Field>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
