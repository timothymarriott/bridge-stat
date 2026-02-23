import { Hono } from "hono";
import link from "./link";
import { auth } from "../auth";
import { RequireAdmin } from "../../utils";
import { UserInformation } from "../../types";
import { db } from "../../database";
import { user, user_profiles } from "../../schema";
import { eq } from "drizzle-orm";
import { FetchMojangProfile } from "../../mojang";

const admin = new Hono<{
	Bindings: Env;
	Variables: {
		user: typeof auth.$Infer.Session.user | null;
		session: typeof auth.$Infer.Session.session | null;
	};
}>();

admin.use("*", RequireAdmin);
admin.route("/link", link);

admin.use("/", async (c) => {
	return c.text("You are an admin");
});

admin.get("/users", async (c) => {
	const result: UserInformation[] = [];
	const raw = await db.select().from(user);

	await Promise.all(
		raw.map((element) =>
			(async () => {
				const [profile] = await db
					.select()
					.from(user_profiles)
					.where(eq(user_profiles.id, element.id))
					.limit(1);

				if (profile.uuid != null && profile.username == null) {
					const data = await FetchMojangProfile(profile.uuid);
					profile.username = data.username;
					await db
						.update(user_profiles)
						.set({
							username: data.username,
						})
						.where(eq(user_profiles.id, element.id));
				}

				result.push({
					...element,
					...profile,
				});
			})(),
		),
	);

	result.sort((a, b) => a.name.localeCompare(b.name));
	return c.json(result);
});

export default admin;
