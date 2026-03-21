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
	MatchUploadMessage,
	MatchUploadResponse,
} from "@/worker/types";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { api_client } from "../queries";

function getFileTimestamp(file: File): number {
	const name = file.name;

	const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2})_(\d{2})_(\d{2})/.exec(name);

	if (match) {
		const [, year, month, day, hour, minute, second] = match;

		const date = new Date(
			Number(year),
			Number(month) - 1,
			Number(day),
			Number(hour),
			Number(minute),
			Number(second),
		);

		return date.getTime();
	}

	return file.lastModified;
}

export default function UploadMatchDialog({ children }: { children: ReactNode }) {
	const inputRef = useRef<HTMLInputElement>(null);

	const [open, setOpen] = useState<boolean>(false);

	const [isUploading, setIsUploading] = useState<boolean>(false);

	const [isParsing, setIsParsing] = useState<boolean>(false);
	const [progressInfo, setProgressInfo] = useState<
		{
			name: string;
			progress: number;
		}[]
	>([]);

	const parsingProgress = (() => {
		if (progressInfo.length === 0) return 0;

		const total = progressInfo.reduce((sum, item) => sum + item.progress, 0);
		return total / progressInfo.length;
	})();

	const [matchesToUpload, setMatchesToUpload] = useState<FullMatchInsertData[]>([]);

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
							<ScrollArea className="h-72 bg-secondary/80 p-2 rounded-sm">
								<div className="grid grid-cols-2">
									{progressInfo.map((p) => {
										if (p.progress == 1) return null;
										return (
											<>
												<span>{p.name}</span>
												<Progress value={p.progress * 100}></Progress>
											</>
										);
									})}
								</div>
							</ScrollArea>
						</div>
					) : (
						<></>
					)
				) : (
					<>
						{/* //00000375-00000000-00005035-99f099f64a8bf012f70678156ee18dcb RESTORE POINT FOR OLD DATA */}
						{matchesToUpload.length == 0 ? (
							<Field>
								<FieldLabel htmlFor={"file"}>File</FieldLabel>111
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
										You are about to upload {matchesToUpload.length} matche/s.
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
												setOpen(false);
												setProgressInfo([]);
											}}
										>
											Abort
										</Button>
										<Button
											variant={"destructive"}
											onClick={() => {
												void (async () => {
													setIsUploading(true);

													const socket =
														api_client.api.upload.match.$ws();

													await new Promise<void>((resolve) => {
														socket.addEventListener("open", () => {
															resolve();
														});
													});

													await Promise.all(
														matchesToUpload.map((m, id) => {
															return new Promise<void>((resolve) => {
																const req: MatchUploadMessage = {
																	id: id,
																	match: m,
																};
																const handler = (
																	evt: WebSocketEventMap["message"],
																) => {
																	const data = JSON.parse(
																		evt.data as string,
																	) as MatchUploadResponse;
																	if (data.id == id) {
																		socket.removeEventListener(
																			"message",
																			handler,
																		);
																		resolve();
																	}
																};
																socket.addEventListener(
																	"message",
																	handler,
																);
																socket.send(JSON.stringify(req));
															});
														}),
													);

													setIsUploading(false);
													setMatchesToUpload([]);
													setProgressInfo([]);
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
												setProgressInfo([]);
												if (
													inputRef.current?.files &&
													inputRef.current.files.length > 0
												) {
													const matches: FullMatchInsertData[] = [];
													const preview: Match[] = [];
													const files: File[] = [];
													for (const file of inputRef.current.files) {
														files.push(file);
													}

													files.sort(
														(a, b) => a.lastModified - b.lastModified,
													);

													await Promise.allSettled(
														files.map(async (file) => {
															const flashback = new Flashback(
																getFileTimestamp(file),
															);

															setProgressInfo((orig) =>
																[
																	...orig.filter(
																		(a) => a.name != file.name,
																	),
																	{
																		name: file.name,
																		progress: 0,
																	},
																].sort((a, b) =>
																	a.name.localeCompare(b.name),
																),
															);

															flashback.callbacks.onTick = () => {
																setProgressInfo((orig) =>
																	[
																		...orig.filter(
																			(a) =>
																				a.name != file.name,
																		),
																		{
																			name: file.name,
																			progress:
																				flashback.metadata
																					? flashback.tick /
																						flashback
																							.metadata
																							.total_ticks
																					: 0,
																		},
																	].sort((a, b) =>
																		a.name.localeCompare(
																			b.name,
																		),
																	),
																);
															};

															const res = await flashback.findGames(
																await file.bytes(),
															);

															setProgressInfo((orig) =>
																[
																	...orig.filter(
																		(a) => a.name != file.name,
																	),
																	{
																		name: file.name,
																		progress: 1,
																	},
																].sort((a, b) =>
																	a.name.localeCompare(b.name),
																),
															);

															const matches_data: FullMatchInsertData[] =
																[];

															for (const match of res) {
																match.red_players.forEach((v) => {
																	v.username = v.username
																		.replace(
																			"trianglepoger1",
																			"trianglepoger",
																		)
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
																			"trianglepoger1",
																			"trianglepoger",
																		)
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

															matches.push(...matches_data);
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
												setProgressInfo([]);
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
