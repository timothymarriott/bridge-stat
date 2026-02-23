import { relations, sql } from "drizzle-orm";
import { sqliteTable, text, integer, index, int } from "drizzle-orm/sqlite-core";
import { Team } from "./types";

export const user = sqliteTable("user", {
	id: text("id").primaryKey(),
	name: text("name").notNull(),
	email: text("email").notNull().unique(),
	emailVerified: integer("email_verified", { mode: "boolean" }).default(false).notNull(),
	image: text("image"),
	createdAt: integer("created_at", { mode: "timestamp_ms" })
		.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
		.notNull(),
	updatedAt: integer("updated_at", { mode: "timestamp_ms" })
		.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
		.$onUpdate(() => /* @__PURE__ */ new Date())
		.notNull(),
});

export const user_profiles = sqliteTable("profiles", {
	id: text("id")
		.primaryKey()
		.references(() => user.id, { onDelete: "cascade" }),
	uuid: text("uuid"),
	username: text("username"),
	is_admin: int("is_admin").notNull().default(0),
	awaiting_link_request: int("awaiting_link_request").notNull().default(0),
});

export const link_requests = sqliteTable("link_requests", {
	id: int("id").primaryKey(),
	user: text("user").references(() => user.id, { onDelete: "cascade" }),
	uuid: text("uuid").notNull(),
});

// export const api_keys = sqliteTable("api_keys", {
// 	id: int("id").primaryKey(),
// 	owner: text("owner").references(() => user.id, { onDelete: "cascade" }),
// 	key: text("key")
// 		.notNull()
// 		.$default(() => {
// 			const buffer = new Uint8Array(32);
// 			crypto.getRandomValues(buffer);

// 			return btoa(String.fromCharCode(...buffer))
// 				.replace(/\+/g, "-")
// 				.replace(/\//g, "_")
// 				.replace(/=+$/, "");
// 		})
// 		.unique(),
// });

export const matches = sqliteTable("matches", {
	id: int("id").primaryKey(),

	winner: int("winner").$type<Team>(),
	red_scores: int("red_scores").default(0),
	blue_scores: int("blue_scores").default(0),
});

export const user_performances = sqliteTable("user_performances", {
	id: int("id").primaryKey(),
	match: int("match").references(() => matches.id, { onDelete: "cascade" }),
	user: text("owner").references(() => user.id, { onDelete: "cascade" }),

	team: int("team").$type<Team>(),

	kills: int("kills").default(0),
	deaths: int("deaths").default(0),
	scores: int("scores").default(0),
});

export const session = sqliteTable(
	"session",
	{
		id: text("id").primaryKey(),
		expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
		token: text("token").notNull().unique(),
		createdAt: integer("created_at", { mode: "timestamp_ms" })
			.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
			.notNull(),
		updatedAt: integer("updated_at", { mode: "timestamp_ms" })
			.$onUpdate(() => /* @__PURE__ */ new Date())
			.notNull(),
		ipAddress: text("ip_address"),
		userAgent: text("user_agent"),
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
	},
	(table) => [index("session_userId_idx").on(table.userId)],
);

export const account = sqliteTable(
	"account",
	{
		id: text("id").primaryKey(),
		accountId: text("account_id").notNull(),
		providerId: text("provider_id").notNull(),
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		accessToken: text("access_token"),
		refreshToken: text("refresh_token"),
		idToken: text("id_token"),
		accessTokenExpiresAt: integer("access_token_expires_at", {
			mode: "timestamp_ms",
		}),
		refreshTokenExpiresAt: integer("refresh_token_expires_at", {
			mode: "timestamp_ms",
		}),
		scope: text("scope"),
		password: text("password"),
		createdAt: integer("created_at", { mode: "timestamp_ms" })
			.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
			.notNull(),
		updatedAt: integer("updated_at", { mode: "timestamp_ms" })
			.$onUpdate(() => /* @__PURE__ */ new Date())
			.notNull(),
	},
	(table) => [index("account_userId_idx").on(table.userId)],
);

export const verification = sqliteTable(
	"verification",
	{
		id: text("id").primaryKey(),
		identifier: text("identifier").notNull(),
		value: text("value").notNull(),
		expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
		createdAt: integer("created_at", { mode: "timestamp_ms" })
			.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
			.notNull(),
		updatedAt: integer("updated_at", { mode: "timestamp_ms" })
			.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
			.$onUpdate(() => /* @__PURE__ */ new Date())
			.notNull(),
	},
	(table) => [index("verification_identifier_idx").on(table.identifier)],
);

export const userRelations = relations(user, ({ many }) => ({
	sessions: many(session),
	accounts: many(account),
}));

export const sessionRelations = relations(session, ({ one }) => ({
	user: one(user, {
		fields: [session.userId],
		references: [user.id],
	}),
}));

export const accountRelations = relations(account, ({ one }) => ({
	user: one(user, {
		fields: [account.userId],
		references: [user.id],
	}),
}));
