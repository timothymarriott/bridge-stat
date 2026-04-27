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
import { PerformanceDisplay } from "./performances-list";
import { useData } from "./data-hook";

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

function uploadWithProgress(
	url: string,
	file: File,
	onProgress: (percent: number, loaded: number, total: number) => void,
): Promise<void> {
	return new Promise((resolve, reject) => {
		const xhr = new XMLHttpRequest();

		xhr.open("PUT", url);

		xhr.upload.onprogress = (event) => {
			if (event.lengthComputable) {
				const percent = event.loaded / event.total;
				onProgress(percent, event.loaded, event.total);
			}
		};

		xhr.onload = () => {
			if (xhr.status >= 200 && xhr.status < 300) {
				resolve();
			} else {
				reject(new Error(`Upload failed: ${xhr.status.toString()}`));
			}
		};

		xhr.onerror = reject;

		xhr.send(file);
	});
}

export default function UploadMatchDialog({ children }: { children: ReactNode }) {
	const data = useData();
	const inputRef = useRef<HTMLInputElement>(null);

	const [open, setOpen] = useState<boolean>(false);

	const [isUploading, setIsUploading] = useState<boolean>(false);

	const [isParsing, setIsParsing] = useState<boolean>(false);
	const [errors, setErrors] = useState<
		{
			name: string;
			error: string;
		}[]
	>([]);
	const [progressInfo, setProgressInfo] = useState<
		{
			name: string;
			progress: number;
			uploadProgress: number;
		}[]
	>([]);

	const parsingProgress = (() => {
		if (progressInfo.length === 0) return 0;

		const total = progressInfo.reduce((sum, item) => sum + item.progress, 0);
		return total / progressInfo.length;
	})();

	const uploadingProgress = (() => {
		if (progressInfo.length === 0) return 0;

		const total = progressInfo.reduce((sum, item) => sum + item.uploadProgress, 0);
		return total / progressInfo.length;
	})();

	const [matchesToUpload, setMatchesToUpload] = useState<FullMatchInsertData[]>([]);

	const [matchPreviews, setMatchPreviews] = useState<Match[]>([]);

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			{children}
			<DialogContent className="sm:max-w-md w-md" showCloseButton={false}>
				<DialogHeader>
					<DialogTitle>Upload Matches</DialogTitle>
				</DialogHeader>
				{isParsing || isUploading || matchesToUpload.length > 0 ? (
					<ScrollArea className="h-72 p-2 rounded-sm">
						<div className="space-y-1 flex flex-col">
							{matchPreviews.map((m, i) => {
								return <PerformanceDisplay match={m} i={i}></PerformanceDisplay>;
							})}
						</div>
					</ScrollArea>
				) : null}
				{isUploading || isParsing ? (
					isUploading ? (
						<div>Uploading...</div>
					) : isParsing ? (
						<div className="flex flex-col space-y-2">
							<span>Parsing...</span>

							<div className="flex flex-row">
								<span>{(parsingProgress * 100).toFixed(1)}%</span>
								<Progress value={parsingProgress * 100} />
							</div>
							<div className="flex flex-row">
								<span>{(uploadingProgress * 100).toFixed(1)}%</span>
								<Progress value={uploadingProgress * 100} />
							</div>
							<ScrollArea className="h-72 bg-secondary/80 p-2 rounded-sm">
								<div className="grid grid-cols-3">
									{progressInfo.map((p) => {
										if (p.progress == 1 && p.uploadProgress == 1) return null;
										return (
											<>
												<span key={p.name + "_name"}>{p.name}</span>
												<Progress
													key={p.name + "_prog"}
													value={p.progress * 100}
												></Progress>
												<Progress
													key={p.name + "_upload"}
													value={p.uploadProgress * 100}
												></Progress>
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
						{errors.length > 0 ? (
							<ScrollArea className="h-72 bg-secondary/80 p-2 rounded-sm">
								<div className="grid grid-cols-2">
									{errors.map((p) => {
										return (
											<>
												<span key={p.name + "_name"}>{p.name}</span>
												<span
													key={p.name + "_error"}
													className="text-red-400"
												>
													{p.error}
												</span>
											</>
										);
									})}
								</div>
							</ScrollArea>
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
												setMatchPreviews([]);
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
													setMatchPreviews([]);
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
												setMatchPreviews([]);
												setErrors([]);
												if (
													inputRef.current?.files &&
													inputRef.current.files.length > 0
												) {
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

															const res =
																await api_client.api.upload.request.$get();

															const uploadData = await res.json();

															setProgressInfo((orig) =>
																[
																	...orig.filter(
																		(a) => a.name != file.name,
																	),
																	{
																		name: file.name,
																		progress: 0,
																		uploadProgress: 0,
																	},
																].sort((a, b) =>
																	a.name.localeCompare(b.name),
																),
															);

															if (uploadData.authenticated) {
																await uploadWithProgress(
																	uploadData.url,
																	file,
																	(progress) => {
																		setProgressInfo((orig) =>
																			[
																				...orig.filter(
																					(a) =>
																						a.name !=
																						file.name,
																				),
																				{
																					name: file.name,
																					progress: 0,
																					uploadProgress:
																						progress,
																				},
																			].sort((a, b) =>
																				a.name.localeCompare(
																					b.name,
																				),
																			),
																		);
																	},
																);
															}

															setProgressInfo((orig) =>
																[
																	...orig.filter(
																		(a) => a.name != file.name,
																	),
																	{
																		name: file.name,
																		progress: 0,
																		uploadProgress: 1,
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
																			uploadProgress: 1,
																		},
																	].sort((a, b) =>
																		a.name.localeCompare(
																			b.name,
																		),
																	),
																);
															};

															flashback.callbacks.onMatch = async (
																match,
															) => {
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

																setMatchesToUpload((orig) =>
																	[...orig, match].sort(
																		(a, b) => a.date - b.date,
																	),
																);

																const preview =
																	await GetMatchPreview(
																		match,
																		data.players,
																	);

																setMatchPreviews((orig) => [
																	...orig,
																	preview,
																]);
															};

															try {
																await flashback.findGames(
																	await file.bytes(),
																);
															} catch (e) {
																if (e instanceof Error) {
																	setErrors((orig) => [
																		...orig,
																		{
																			name: file.name,
																			error: e.message,
																		},
																	]);
																	setProgressInfo((orig) =>
																		[
																			...orig.filter(
																				(a) =>
																					a.name !=
																					file.name,
																			),
																			{
																				name: file.name,
																				progress: 1,
																				uploadProgress: 1,
																			},
																		].sort((a, b) =>
																			a.name.localeCompare(
																				b.name,
																			),
																		),
																	);
																}
															}

															setProgressInfo((orig) =>
																[
																	...orig.filter(
																		(a) => a.name != file.name,
																	),
																	{
																		name: file.name,
																		progress: 1,
																		uploadProgress: 1,
																	},
																].sort((a, b) =>
																	a.name.localeCompare(b.name),
																),
															);
														}),
													);
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
