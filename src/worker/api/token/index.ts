import { Hono } from "hono";
import { auth } from "../auth";

const token = new Hono<{
	Bindings: Env;
	Variables: {
		user: typeof auth.$Infer.Session.user | null;
		session: typeof auth.$Infer.Session.session | null;
	};
}>();

token.get("/:user/list", async (c) => {
	const user = c.get("user");

	if (!user) return c.body("Unauthorized", 401);
});

export default token;
