import { Hono, TypedResponse } from "hono";
import { better_auth } from "../auth";
import { RequireAdmin } from "../../utils";
import { GetUsers } from "../../requests";
import link from "./link";
import { UserInformation } from "../../types";
import { RequireAuthInformation } from "../..";

export const admin = new Hono<{
	Bindings: Env;
	Variables: {
		user: typeof better_auth.$Infer.Session.user | null;
		session: typeof better_auth.$Infer.Session.session | null;
	};
}>()
	.use("*", RequireAuthInformation)
	.use("*", RequireAdmin)
	.route("/link", link)
	.get<"/users", {}, TypedResponse<UserInformation[]>>("/users", async (c) => {
		return c.json<UserInformation[]>(await GetUsers());
	});

export default admin;
