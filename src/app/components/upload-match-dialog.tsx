import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Field, FieldLabel } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { ReactNode, useRef, useState } from "react";
import Flashback from "../../lib/flashback";
import {
	FullMatchInsertData,
	GetMatchPreview,
	Match,
	MatchUploadRequestMetaData,
} from "@/worker/types";

export default function UploadMatchDialog({ children }: { children: ReactNode }) {
	const inputRef = useRef<HTMLInputElement>(null);

	const [open, setOpen] = useState<boolean>(false);

	const [isUploading, setIsUploading] = useState<boolean>(false);

	const [matchesToUpload, setMatchesToUpload] = useState<
		{
			data: FullMatchInsertData[];
			file: File;
		}[]
	>([]);

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			{children}
			<DialogContent className="sm:max-w-md" showCloseButton={false}>
				<DialogHeader>
					<DialogTitle>Upload Matches</DialogTitle>
				</DialogHeader>
				{isUploading ? (
					<div>Uploading...</div>
				) : (
					<>
						{matchesToUpload.length == 0 ? (
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
						) : null}

						<DialogFooter>
							{matchesToUpload.length > 0 ? (
								<div className="flex flex-col">
									<span>
										You are about to upload {matchesToUpload.length} matches.
									</span>
									<span>
										They will be reviewed by a moderator before being added to
										the leaderboard.
									</span>
									<div className="flex flex-row space-x-2">
										<Button
											variant={"secondary"}
											onClick={() => {
												setIsUploading(false);
												setMatchesToUpload([]);
												setOpen(false);
											}}
										>
											Abort
										</Button>
										<Button
											variant={"destructive"}
											onClick={() => {
												void (async () => {
													setIsUploading(true);
													await Promise.allSettled(
														matchesToUpload.map(async (match) => {
															const formData = new FormData();
															formData.append("file", match.file);
															const upload_data: MatchUploadRequestMetaData =
																{
																	matches: match.data,
																};
															formData.append(
																"meta",
																JSON.stringify(upload_data),
															);
															await fetch("/api/upload/match", {
																body: formData,
																method: "POST",
															});
														}),
													);
													setIsUploading(false);
													setMatchesToUpload([]);
													setOpen(false);
												})();
											}}
										>
											Continue
										</Button>
									</div>
								</div>
							) : (
								<div>
									<Button
										onClick={() => {
											void (async () => {
												if (
													inputRef.current?.files &&
													inputRef.current.files.length > 0
												) {
													const matches: {
														data: FullMatchInsertData[];
														file: File;
													}[] = [];
													const preview: Match[] = [];
													const files: File[] = [];
													for (const file of inputRef.current.files) {
														files.push(file);
													}

													files.sort(
														(a, b) => a.lastModified - b.lastModified,
													);

													for (const file of files) {
														const flashback = new Flashback(
															file.lastModified,
														);
														const res = await flashback.findGames(
															await file.bytes(),
														);

														const matches_data: FullMatchInsertData[] =
															[];

														for (const match of res) {
															match.red_players.forEach((v) => {
																v.username = v.username
																	.replace(
																		"JoeBartLover",
																		"TheMoon021",
																	)
																	.replace(
																		"Jordano120",
																		"Tetron_",
																	);
															});

															match.blue_players.forEach((v) => {
																v.username = v.username
																	.replace(
																		"JoeBartLover",
																		"TheMoon021",
																	)
																	.replace(
																		"Jordano120",
																		"Tetron_",
																	);
															});

															matches_data.push(match);

															preview.push(
																await GetMatchPreview(match),
															);
														}

														matches.push({
															data: matches_data,
															file: file,
														});
														/*

												const formData = new FormData();
												formData.append("file", file);
												const upload_data: MatchUploadRequestMetaData = {
													matches: matches_data,
												};
												formData.append(
													"meta",
													JSON.stringify(upload_data),
												);
												const upload_res = await fetch(
													"/api/upload/match",
													{
														body: formData,
														method: "POST",
													},
												);
												*/
													}

													setMatchesToUpload(matches);
												}
											})();
										}}
									>
										Parse
									</Button>
								</div>
							)}
						</DialogFooter>
					</>
				)}
			</DialogContent>
		</Dialog>
	);
}
