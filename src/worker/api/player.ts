import { Hono } from "hono";
import { better_auth } from "./auth";
import { GetPlayerInformationByUser, GetPlayerInformationByUsername, GetUsers } from "../requests";
import { OptionalPlayerInformation } from "../types";
import { TypedResponse } from "hono/types";

export const player = new Hono<{
	Variables: {
		user: typeof better_auth.$Infer.Session.user | null;
		session: typeof better_auth.$Infer.Session.session | null;
	};
}>()
	.get<"/list", {}, TypedResponse<OptionalPlayerInformation[]>>("/list", async (c) => {
		const users = await GetUsers();

		const result = await Promise.all(users.map((usr) => GetPlayerInformationByUser(usr)));

		return c.json<OptionalPlayerInformation[]>(result);
	})
	.get<"/info/:username", {}, TypedResponse<OptionalPlayerInformation>>(
		"/info/:username",
		async (c) => {
			const { username } = c.req.param();
			return c.json<OptionalPlayerInformation>(
				await GetPlayerInformationByUsername(username),
			);
		},
	);

export default player;
