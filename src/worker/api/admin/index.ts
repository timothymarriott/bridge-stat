import { Hono, TypedResponse } from "hono";
import { GetUsers, UploadMatch } from "../../requests";
import link from "./link";
import { FullMatchInsertData, UserInformation } from "../../types";
import { RequireAuthInformation } from "../..";
import { db } from "../../database";
import { matches, user_profiles } from "../../schema";
import { eq } from "drizzle-orm";
import { better_auth } from "../../better_auth";

export const admin = new Hono<{
	Variables: {
		user: typeof better_auth.$Infer.Session.user | null;
		session: typeof better_auth.$Infer.Session.session | null;
	};
}>()
	.use("*", RequireAuthInformation)
	.use("*", async (c, next) => {
		const user = c.get("user");

		if (!user) {
			return c.body("Unauthorized", 401);
		}

		const [profile] = await db
			.select({ isAdmin: user_profiles.is_admin })
			.from(user_profiles)
			.where(eq(user_profiles.id, user.id))
			.limit(1);

		if (profile.isAdmin == 0) {
			return c.body("Forbidden", 403);
		}

		return next();
	})
	.route("/link", link)
	.post<"/upload">("/upload", async (c) => {
		const text = await c.req.text();
		const data: FullMatchInsertData = (await JSON.parse(text)) as FullMatchInsertData;

		await UploadMatch(data, true);
		return c.body(null, 200);
	})
	.post<
		"/verify",
		{
			in: {
				match_id: number;
			};
		}
	>("/verify", async (c) => {
		await db.update(matches).set({
			verified: 1,
		});
		return c.body(null, 200);
	})
	.get<"/users", object, TypedResponse<UserInformation[]>>("/users", async (c) => {
		return c.json<UserInformation[]>(await GetUsers());
	});

export default admin;
