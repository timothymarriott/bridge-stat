import { Hono, TypedResponse } from "hono";
import { CreateUserProfile, GetUserProfileById, UpdateProfileUsername } from "../requests";
import { OptionalUserInformation, User } from "../types";
import { FetchMojangProfile } from "../mojang";
import { RequireAuthInformation } from "..";
import { better_auth } from "../better_auth";

export const auth = new Hono<{
	Variables: {
		user: User | null;
		session: typeof better_auth.$Infer.Session.session | null;
	};
}>()
	.use("*", RequireAuthInformation)
	.get<"/", object, TypedResponse<OptionalUserInformation>>("/", async (c) => {
		const user = c.get("user");

		if (!user)
			return c.json<OptionalUserInformation>(
				{
					exists: false,
				},
				200,
			);

		let res = await GetUserProfileById(user.id);
		res ??= await CreateUserProfile(user.id);

		if (res.uuid != null && res.username == null) {
			const data = await FetchMojangProfile(res.uuid);
			res.username = data.username;
			await UpdateProfileUsername(user.id, res.username);
		}

		const result: OptionalUserInformation = {
			...res,
			...user,
			exists: true,
		};

		return c.json<OptionalUserInformation>(result);
	})
	.on(["POST", "GET"], "/*", (c) => {
		return better_auth.handler(c.req.raw);
	});

export default auth;
