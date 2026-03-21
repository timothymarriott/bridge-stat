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
import Flashback, { TextComponent } from "../../lib/flashback";
import {
	FullMatchInsertData,
	GetMatchPreview,
	Match,
	MatchUploadRequestMetaData,
} from "@/worker/types";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { TextComponentRenderer } from "./text-component-renderer";

export default function UploadMatchDialog({ children }: { children: ReactNode }) {
	const inputRef = useRef<HTMLInputElement>(null);

	const [open, setOpen] = useState<boolean>(false);

	const [isUploading, setIsUploading] = useState<boolean>(false);

	const [isParsing, setIsParsing] = useState<boolean>(false);
	const [parsingProgress, setParsingProgress] = useState<number>(0);

	const [chatMessages, setChatMessages] = useState<TextComponent[]>([]);

	const [matchesToUpload, setMatchesToUpload] = useState<
		{
			data: FullMatchInsertData[];
			file: File;
		}[]
	>([]);

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			{children}
			<DialogContent className="sm:max-w-md w-md" showCloseButton={false}>
				<DialogHeader>
					<DialogTitle>Upload Matches</DialogTitle>
				</DialogHeader>
				{/* {isParsing || matchesToUpload.length > 0 ? (
					<ScrollArea className="h-72 bg-secondary/80 p-2 rounded-sm">
						<div className="flex flex-col">
							{chatMessages.map((msg) => {
								return (
									<>
										<TextComponentRenderer content={msg} /> <br></br>{" "}
									</>
								);
							})}
						</div>
					</ScrollArea>
				) : null} */}
				{isUploading || isParsing ? (
					isUploading ? (
						<div>Uploading...</div>
					) : isParsing ? (
						<div className="flex flex-col space-y-2">
							<span>Parsing...</span>
							<span>{(parsingProgress * 100).toFixed(1)}%</span>
							<Progress value={parsingProgress * 100} />
						</div>
					) : (
						<></>
					)
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
										You are about to upload {matchesToUpload.length} replay/s.
									</span>
									<span>
										They will be reviewed by a moderator before being added to
										the leaderboard.
									</span>
									<div className="flex flex-row space-x-2">
										<Button
											variant={"secondary"}
											onClick={() => {
												setIsParsing(false);
												setIsUploading(false);
												setMatchesToUpload([]);
												setChatMessages([]);
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
													setChatMessages([]);
													const all_matches: FullMatchInsertData[] = [];
													matchesToUpload.forEach((match) => {
														all_matches.push(...match.data);
													});

													const formData = new FormData();
													const upload_data: MatchUploadRequestMetaData =
														{
															matches: all_matches,
														};
													formData.append(
														"meta",
														JSON.stringify(upload_data),
													);
<<<<<<< HEAD
													const res = await flashback.findGames(
														await file.bytes(),
													);
													matches.push(...res);

													let j = 0;

													for (const match of res) {
														console.log(
															`${i.toString()}/${files.length.toString()} (${j.toString()}/${res.length.toString()}) ${file.name} ${file.lastModified.toString()}`,
														);

														match.red_players.forEach((v) => {
															v.username = v.username
																.replace(
																	"JoeBartLover",
																	"TheMoon021",
																)
																.replace("Jordano120", "Tetron_")
																.replace(
																	"trianglepoger",
																	"trianglepoger1",
																);
														});

														match.blue_players.forEach((v) => {
															v.username = v.username
																.replace(
																	"JoeBartLover",
																	"TheMoon021",
																)
																.replace("Jordano120", "Tetron_")
																.replace(
																	"trianglepoger",
																	"trianglepoger1",
																);
														});

														await fetch("/api/admin/upload", {
															credentials: "include",
															method: "POST",
															body: JSON.stringify(match),
														});

														j++;
=======
													await fetch("/api/upload/match", {
														body: formData,
														method: "POST",
													});
													setIsUploading(false);
													setMatchesToUpload([]);
													setChatMessages([]);
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
												setIsParsing(true);
												setParsingProgress(0);
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
>>>>>>> b9313572f9b7eb3d9db73c1a56f3fcb50a5f8d11
													}

													files.sort(
														(a, b) => a.lastModified - b.lastModified,
													);

													await Promise.allSettled(
														files.map(async (file) => {
															const flashback = new Flashback(
																file.lastModified,
															);
															flashback.callbacks.onChatMessage = (
																content,
															) => {
																setChatMessages((old) => [
																	...old,
																	content,
																]);
															};
															const res = await flashback.findGames(
																await file.bytes(),
															);

															setParsingProgress(
																(old) => old + 1 / files.length,
															);

															const matches_data: FullMatchInsertData[] =
																[];

															for (const match of res) {
																match.red_players.forEach((v) => {
																	v.username = v.username
																		.replace(
																			"trianglepoger",
																			"trianglepoger1",
																		)
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
																			"trianglepoger",
																			"trianglepoger1",
																		)
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
														}),
													);

													setMatchesToUpload(matches);
												}
												setParsingProgress(1);
												setIsParsing(false);
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
