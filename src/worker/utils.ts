import { eq } from "drizzle-orm";
import { user_profiles } from "./schema";
import { db } from "./database";

export async function RequireAdmin(c: any, next: any) {
	const user = c.get("user");

	if (!user) {
		return c.body("Unauthorized", 401);
	}

	const [profile] = await db
		.select({ isAdmin: user_profiles.is_admin })
		.from(user_profiles)
		.where(eq(user_profiles.id, user.id))
		.limit(1);

	console.log(profile);

	if (profile.isAdmin == 0) {
		return c.body("Forbidden", 403);
	}

	return next();
}
