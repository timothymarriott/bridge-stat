import { Hono, TypedResponse } from "hono";
import { db } from "../../database";
import { link_requests, user, user_profiles } from "../../schema";
import { eq } from "drizzle-orm";
import { FetchMojangProfile } from "../../mojang";
import { LinkRequestList } from "../../types";
import { better_auth } from "../auth";

export const link = new Hono<{
	Variables: {
		user: typeof better_auth.$Infer.Session.user | null;
		session: typeof better_auth.$Infer.Session.session | null;
	};
}>()
	.post("/accept/:id", async (c) => {
		const { id } = c.req.param();
		const [res] = await db.select().from(link_requests).where(eq(link_requests.user, id));
		await db.delete(link_requests).where(eq(link_requests.user, id));
		const profile = await FetchMojangProfile(res.uuid);
		await db
			.update(user_profiles)
			.set({
				awaiting_link_request: 0,
				uuid: res.uuid,
				username: profile.username,
			})
			.where(eq(user_profiles.id, id));
		return c.body(null, 200);
	})
	.post("/deny/:id", async (c) => {
		const { id } = c.req.param();
		await db.delete(link_requests).where(eq(link_requests.user, id));
		await db
			.update(user_profiles)
			.set({
				awaiting_link_request: 0,
				uuid: null,
				username: null,
			})
			.where(eq(user_profiles.id, id));
		return c.body(null, 200);
	})
	.post("/unlink/:id", async (c) => {
		const { id } = c.req.param();
		await db.delete(link_requests).where(eq(link_requests.user, id));
		await db
			.update(user_profiles)
			.set({
				awaiting_link_request: 0,
				uuid: null,
				username: null,
			})
			.where(eq(user_profiles.id, id));
		return c.body(null, 200);
	})
	.get<"/list", {}, TypedResponse<LinkRequestList>>("/list", async (c) => {
		const result: LinkRequestList = [];
		const raw = await db.select().from(link_requests);
		await Promise.all(
			raw.map((element) =>
				(async () => {
					const [_user] = await db
						.select()
						.from(user)
						.where(eq(user.id, element.user ?? ""))
						.limit(1);
					const [profile] = await db
						.select()
						.from(user_profiles)
						.where(eq(user_profiles.id, element.user ?? ""))
						.limit(1);

					const data = await FetchMojangProfile(element.uuid);

					result.push({
						user: {
							..._user,
							...profile,
						},
						target: {
							uuid: data.uuid,
							username: data.username,
						},
					});
				})(),
			),
		);
		result.sort((a, b) => a.user.name.localeCompare(b.user.name));
		return c.json<LinkRequestList>(result);
	});

export default link;
