import { env } from "cloudflare:workers";
import { MCProfileInfo } from "./types";

export async function FetchMojangProfile(uuid: string): Promise<MCProfileInfo> {
	if (!env.mc_user_cache) {
		throw Error("No User Cache");
	}

	const res: MCProfileInfo | null = await env.mc_user_cache.get(uuid, "json");

	if (res == null) {
		console.log("Reaching out to mojang for " + uuid);
		const info = await fetch("https://mcprofile.io/api/v1/java/uuid/" + uuid);
		const data: MCProfileInfo = await (info.json() as Promise<MCProfileInfo>);
		await env.mc_user_cache.put(uuid, JSON.stringify(data));
		data.cache = "MISS";
		return data;
	} else {
		res.cache = "HIT";
		return res;
	}
}
