import { env } from "cloudflare:workers";
import { MCProfileInfo } from "./types";

export async function FetchMojangProfile(uuid: string): Promise<MCProfileInfo> {
	if (!env.mc_user_cache) {
		throw Error("No User Cache");
	}

	const res: MCProfileInfo | null = await env.mc_user_cache.get(uuid, "json");

	if (res == null) {
		console.log("Reaching out to mojang for " + uuid);
		const info = await fetch("https://api.mojang.com/user/profile/" + uuid);
		const raw = await info.json<{
			name: string;
			id: string;
		}>();
		const data: MCProfileInfo = {
			username: raw.name,
			uuid: formatUuidDashed(raw.id),
			cache: "MISS",
		};
		await env.mc_user_cache.put(uuid, JSON.stringify(data));
		await env.mc_user_cache.put(raw.name, JSON.stringify(data));
		return data;
	} else {
		res.cache = "HIT";
		return res;
	}
}

function formatUuidDashed(uuid: string): string {
	if (!/^[0-9a-fA-F]{32}$/.test(uuid)) {
		throw new Error("Invalid UUID format");
	}

	return (
		uuid.slice(0, 8) +
		"-" +
		uuid.slice(8, 12) +
		"-" +
		uuid.slice(12, 16) +
		"-" +
		uuid.slice(16, 20) +
		"-" +
		uuid.slice(20)
	);
}

export async function FetchMojangProfileFromName(name: string): Promise<MCProfileInfo> {
	if (!env.mc_user_cache) {
		throw Error("No User Cache");
	}

	const res: MCProfileInfo | null = await env.mc_user_cache.get(name, "json");

	if (res == null) {
		console.log("Reaching out to mojang for " + name);
		const info = await fetch("https://api.mojang.com/users/profiles/minecraft/" + name);

		const raw = await info.json<{
			name: string;
			id: string;
		}>();
		const data: MCProfileInfo = {
			username: name,
			uuid: formatUuidDashed(raw.id),
			cache: "MISS",
		};
		await env.mc_user_cache.put(name, JSON.stringify(data));
		await env.mc_user_cache.put(data.uuid, JSON.stringify(data));
		return data;
	} else {
		res.cache = "HIT";
		return res;
	}
}
