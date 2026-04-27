import { Hono, TypedResponse } from "hono";
import { better_auth } from "../better_auth";
import { RequireAuthInformation } from "..";
import { MatchUploadMessage, MatchUploadResponse, UploadResponse } from "../types";
import { UploadMatch } from "../requests";
import { upgradeWebSocket } from "hono/cloudflare-workers";
import { AwsClient } from "aws4fetch";

export const upload = new Hono<{
	Bindings: Env;
	Variables: {
		user: typeof better_auth.$Infer.Session.user | null;
		session: typeof better_auth.$Infer.Session.session | null;
	};
}>()
	.use("*", RequireAuthInformation)
	.get<"/request", object, TypedResponse<UploadResponse>>("/request", async (c) => {
		const user = c.get("user");

		if (!user)
			return c.json<UploadResponse>(
				{
					authenticated: false,
				},
				403,
			);

		const client = new AwsClient({
			accessKeyId: c.env.RUSTFS_ACCESS_KEY,
			secretAccessKey: c.env.RUSTFS_SECRET_KEY,
			service: "s3",
			region: "auto",
		});

		const fileId = crypto.randomUUID();
		const key = `${user.name}/${fileId}.zip`;

		const url = new URL(`https://bridgefs.toysdownunder.com/replays/${key}`);

		const signed = await client.sign(url.toString(), {
			method: "PUT",
			headers: {
				"content-type": "application/octet-stream",
			},
			aws: {
				signQuery: true,
			},
		});

		return c.json<UploadResponse>(
			{
				authenticated: true,
				url: signed.url,
				key,
			},
			200,
		);
	})
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
