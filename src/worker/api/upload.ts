import { Hono } from "hono";
import { better_auth } from "../better_auth";
import { UTApi } from "uploadthing/server";
import { RequireAuthInformation } from "..";
import { MatchUploadRequestMetaData } from "../types";
import { UploadMatch } from "../requests";

export const upload = new Hono<{
	Bindings: Cloudflare.Env;
	Variables: {
		user: typeof better_auth.$Infer.Session.user | null;
		session: typeof better_auth.$Infer.Session.session | null;
	};
}>()
	.use("*", RequireAuthInformation)
	.post<
		"/match",
		{
			in: FormData;
		}
	>("/match", async (c) => {
		const data = await c.req.formData();

		const file = data.get("file");
		const meta = data.get("meta") as string | null;
		if (!file || !meta || !(file instanceof File)) {
			return c.body(null, 400);
		}

		const metadata = JSON.parse(meta) as MatchUploadRequestMetaData;

		const api = new UTApi({
			token: c.env.UPLOADTHING_TOKEN as string,
		});

		const res = await api.uploadFiles([file]);

		if (res[0].error != null) {
			return c.json({
				erorr: res[0].error,
			});
		}

		for (const match of metadata.matches) {
			try {
				await UploadMatch(match, false);
			} catch (err) {
				if (err instanceof Error) {
					if (err.message == "Cannot upload duplicate match.") {
						continue;
					}
				}
				throw err;
			}
		}
		return c.body(null, 200);
	});

export default upload;
