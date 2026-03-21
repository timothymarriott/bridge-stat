import { Hono } from "hono";
import { better_auth } from "../better_auth";
import { RequireAuthInformation } from "..";
import { MatchUploadMessage, MatchUploadResponse } from "../types";
import { UploadMatch } from "../requests";
import { upgradeWebSocket } from "hono/cloudflare-workers";

export const upload = new Hono<{
	Bindings: Cloudflare.Env;
	Variables: {
		user: typeof better_auth.$Infer.Session.user | null;
		session: typeof better_auth.$Infer.Session.session | null;
	};
}>()
	.use("*", RequireAuthInformation)
	.get(
		"/match",
		upgradeWebSocket(() => {
			return {
				onMessage(event, ws) {
					const evt: WebSocketEventMap["message"] = event as WebSocketEventMap["message"];
					void (async () => {
						try {
							const data = JSON.parse(evt.data as string) as MatchUploadMessage;

							const match = data.match;

							try {
								await UploadMatch(match, false);

								const response: MatchUploadResponse = {
									id: data.id,
									success: true,
								};

								ws.send(JSON.stringify(response));
							} catch (err) {
								if (err instanceof Error) {
									const response: MatchUploadResponse = {
										id: data.id,
										success: false,
										error: err.message,
									};
									ws.send(JSON.stringify(response));
								} else {
									const response: MatchUploadResponse = {
										id: data.id,
										success: false,
										error: "Internal Server Error",
									};
									ws.send(JSON.stringify(response));
								}
							}
						} catch {
							ws.send(
								JSON.stringify({
									type: "error",
									message: "invalid payload",
								}),
							);
						}
					})();
				},
			};
		}),
	);

export default upload;
