import { link_requests, matches, user, user_performances, user_profiles } from "./schema";
import { eq, InferSelectModel } from "drizzle-orm";
import { FetchMojangProfile } from "./mojang";
import {
	Match,
	OptionalPlayerInformation,
	OptionalUserInformation,
	Team,
	UserInformation,
} from "./types";
import { db } from "./database";

export async function TimeRequest<TRes>(req: Promise<TRes>, name: string): Promise<TRes> {
	const start = Date.now();
	const res = await req;

	const time = Date.now() - start;

	console.log(name + " took " + Math.floor(time).toString());

	return res;
}

export async function GetUserProfileById(
	id: string,
): Promise<InferSelectModel<typeof user_profiles> | undefined> {
	const res = await TimeRequest(
		db.select().from(user_profiles).where(eq(user_profiles.id, id)).limit(1),
		"Reaching out to cloudflare for user profile",
	);

	return res[0];
}

export async function CreateUserProfile(
	id: string,
): Promise<InferSelectModel<typeof user_profiles>> {
	return (
		await TimeRequest(
			db.insert(user_profiles).values({
				id: id,
			}),
			"Reaching out to cloudflare to create user profile",
		)
	).results[0] as InferSelectModel<typeof user_profiles>;
}

export async function SetUserAwaitingLinkRequest(id: string, value: number) {
	await TimeRequest(
		db
			.update(user_profiles)
			.set({
				awaiting_link_request: value,
			})
			.where(eq(user_profiles.id, id)),
		"Reaching out to cloudflare to set user awaiting request",
	);
}

export async function UpdateProfileUsername(id: string, username: string) {
	await TimeRequest(
		db
			.update(user_profiles)
			.set({
				username: username,
			})
			.where(eq(user_profiles.id, id)),
		"Reaching out to cloudflare to update profile username",
	);
}

export async function AddLinkRequest(id: string, uuid: string) {
	await TimeRequest(
		db.insert(link_requests).values({
			user: id,
			uuid: uuid,
		}),
		"Reaching out to cloudflare to add link request",
	);
	await SetUserAwaitingLinkRequest(id, 1);
}

export async function GetMatches(): Promise<Record<string, Match>> {
	const raw = await TimeRequest(
		db
			.select({
				match: matches,

				performance: user_performances,
			})
			.from(matches)
			.leftJoin(user_performances, eq(user_performances.match, matches.id)),
		"Reaching out to cloudflare to get matches",
	);

	const result: Record<string, Match> = {};
	for (const match of raw) {
		if (result[match.match.id] == undefined) {
			result[match.match.id] = {
				...match.match,
				red_players: [],
				blue_players: [],
			};
		}

		if (match.performance != null && match.performance.team == Team.RED) {
			result[match.match.id].red_players.push(match.performance);
		}
		if (match.performance != null && match.performance.team == Team.BLUE) {
			result[match.match.id].blue_players.push(match.performance);
		}
	}
	return result;
}

export async function GetUsers() {
	const raw = await TimeRequest(
		db
			.select({
				user: user,
				profile: user_profiles,
			})
			.from(user)
			.leftJoin(user_profiles, eq(user.id, user_profiles.id)),
		"Reaching out to cloudflare to get users",
	);

	const result: UserInformation[] = await Promise.all(
		raw.map(async (value) => {
			if (value.profile == null) {
				value.profile = await CreateUserProfile(value.user.id);
			}
			if (value.profile.uuid != null && value.profile.username == null) {
				const data = await FetchMojangProfile(value.profile.uuid);
				value.profile.username = data.username;
				await TimeRequest(
					db
						.update(user_profiles)
						.set({
							username: data.username,
						})
						.where(eq(user_profiles.id, value.user.id)),
					"Reaching out to cloudflare to update profile username",
				);
			}

			return {
				...value.user,
				...value.profile,
			};
		}),
	);

	result.sort((a, b) => a.name.localeCompare(b.name));
	return result;
}

export async function GetUserInformationById(id: string): Promise<OptionalUserInformation> {
	const [[raw], [profile]] = await Promise.all([
		TimeRequest(
			db.select().from(user).where(eq(user.id, id)),
			"Reaching out to cloudflare to fetch user",
		),
		TimeRequest(
			db.select().from(user_profiles).where(eq(user_profiles.id, id)).limit(1),
			"Reaching out to cloudflare to fetch user profile",
		),
	]);

	if (raw == undefined) {
		return {
			exists: false,
		};
	}

	if (profile.uuid != null && profile.username == null) {
		const data = await FetchMojangProfile(profile.uuid);
		profile.username = data.username;

		await TimeRequest(
			db
				.update(user_profiles)
				.set({
					username: data.username,
				})
				.where(eq(user_profiles.id, id)),
			"Reaching out to cloudflare to update profile username",
		);
	}

	return {
		exists: true,
		...raw,
		...profile,
	};
}

export async function GetPlayerInformationByUser(
	user: UserInformation,
): Promise<OptionalPlayerInformation> {
	if (user.uuid) {
		return {
			...user,
			performances: [],
			uuid: user.uuid,
			exists: true,
		};
	} else {
		return {
			exists: false,
		};
	}
}

export async function GetPlayerInformationById(id: string): Promise<OptionalPlayerInformation> {
	const [user, performances] = await Promise.all([
		GetUserInformationById(id),
		TimeRequest(
			db.select().from(user_performances).where(eq(user_performances.user, id)),
			"Reaching out to cloudflare to fetch user performances",
		),
	]);

	if (user.exists && user.uuid) {
		return {
			...user,
			performances: performances,
			uuid: user.uuid,
			exists: true,
		};
	} else {
		return {
			exists: false,
		};
	}
}
