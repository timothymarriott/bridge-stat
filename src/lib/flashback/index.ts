import JSZip from "jszip";
import { ByteReader } from "./byteReader";

import rawpackets from "./packets.json";
import { FullMatchInsertData, MatchPlayerInsertData, Team } from "@/worker/types";
import { MAP_NAMES } from "@/lib/data";

export type PacketGroup = {
	clientbound?: Record<
		string,
		{
			protocol_id: number;
		}
	>;
	serverbound?: Record<
		string,
		{
			protocol_id: number;
		}
	>;
};

const packets: {
	configuration: PacketGroup;
	handshake: PacketGroup;
	login: PacketGroup;
	play: PacketGroup;
	status: PacketGroup;
} = rawpackets;

const play_packets: Record<number, string> = {};
Object.keys(packets.play.clientbound ?? {}).forEach((key) => {
	if (!packets.play.clientbound) {
		return;
	}
	const v = packets.play.clientbound[key];
	if (!v) {
		return;
	}
	play_packets[v.protocol_id] = key;
});

export type FlashbackChunkMetadata = {
	duration: number;
	forcePlaySnapshot: boolean;
};

export type FlashbackMetadata = {
	uuid: string;
	name: string;
	version_string: string;
	world_name?: string;
	data_version: number;
	protocol_version: number;
	total_ticks: number;
	customNamespacesForRegistries: object;
	chunks: Record<string, FlashbackChunkMetadata>;
};

const SUPPORTED_VERSION_STRING = "1.21.8";
const SUPPORTED_DATA_VERSION = 4440;
const SUPPORTED_PROTOCOL_VERSION = 772;
const CHUNK_MAGIC = 0xd780e884;

export type TextComponent = {
	text?: string;

	extra?: TextComponent[];

	color?: string;
	font?: string;
	bold?: number;
	italic?: number;
	underlined?: number;
	strikethrough?: number;
	obfuscated?: number;
	shadow_color?: number;

	insertion?: string;

	click_event?: {};

	hover_event?: {};
} & (
	| {
			type: undefined;
	  }
	| {
			type: "text";
			text: string;
	  }
	| {
			type: "translatable";
			translate: string;
			fallback: string;
			with: TextComponent[];
	  }
	| {
			type: "score";
			score: {
				name: string;
				objective: string;
			};
	  }
	| {
			type: "selector";
			selector: string;
			separator?: TextComponent;
	  }
	| {
			type: "keybind";
			keybind: string;
	  }
);

export const PacketParsers: Record<
	string,
	(flashback: Flashback, reader: ByteReader) => Promise<void>
> = {
	"minecraft:system_chat": async (flashback, reader) => {
		const content = reader.read_nbt<TextComponent>();

		if (content.extra) {
			if (flashback.reading_winners && flashback.current_match != null) {
				flashback.reading_winners = false;

				const winners: string[] = [];
				for (const element of content.extra) {
					if (element.click_event && element.text) {
						flashback.ensure_player(element.text.trim());
						flashback.current_match.players[element.text.trim()]!.team =
							flashback.current_match.winner == "Red" ? Team.RED : Team.BLUE;
						winners.push(element.text.trim());
					}
				}
			}

			if (flashback.reading_losers && flashback.current_match != null) {
				flashback.reading_losers = false;

				const losers: string[] = [];
				for (const element of content.extra) {
					if (element.click_event && element.text) {
						flashback.ensure_player(element.text.trim());
						flashback.current_match.players[element.text.trim()]!.team =
							flashback.current_match.winner == "Red" ? Team.BLUE : Team.RED;
						losers.push(element.text.trim());
					}
				}
			}

			if (content.extra.length >= 1) {
				if (content.extra[0]?.text) {
					if (content.extra[0].text == " Losers:") {
						flashback.reading_losers = true;
					}
					if (content.extra[0].text == " Winners:") {
						flashback.reading_winners = true;
					}
					if (content.extra[0].text == "Bridge Duel") {
						flashback.start_match({
							start_tick: flashback.tick,
							end_tick: -1,
							map: undefined,
							players: {},
							winner: "Blue",
						});
					}
				}
			}

			if (content.extra.length == 2) {
				if (content.extra[1]?.text) {
					if (content.extra[1].text == " forfeited.") {
						flashback.current_match = null;
					}
				}
			}

			if (content.extra.length >= 3) {
				if (
					content.extra[1]?.color == "yellow" &&
					content.extra[1].text &&
					content.extra[0]?.text &&
					content.extra[1].text == " scored!" &&
					content.extra[0].color
				) {
					const plr = content.extra[0].text.trim();
					if (flashback.current_match) {
						flashback.current_match.winner = content.extra[0].color as "Red" | "Blue";
						flashback.ensure_player(plr);
						flashback.current_match.players[plr]!.scores += 1;
					}
				}

				if (content.extra[0]?.color && content.extra[2]?.color) {
					if (
						(content.extra[0].color == "red" && content.extra[2].color == "blue") ||
						(content.extra[0].color == "blue" && content.extra[2].color == "red")
					) {
						const died = content.extra[0].text!.trim();
						const killer = content.extra[2].text!.trim();

						if (flashback.current_match) {
							flashback.ensure_player(died);
							flashback.current_match.players[died]!.deaths += 1;
							flashback.ensure_player(killer);
							flashback.current_match.players[killer]!.kills += 1;
						}
					}
				}
			}

			if (content.extra.length >= 4) {
				if (
					flashback.current_match &&
					content.extra[2]?.text == " Map: " &&
					content.extra[3]?.text &&
					flashback.current_match.map == undefined
				) {
					flashback.current_match.map = content.extra[3].text;
				}
			}

			if (content.extra.length == 3 && content.extra[0]?.text && flashback.current_match) {
				if (
					content.extra[1]?.text == "killed themselves" ||
					content.extra[1]?.text == "fell into the void" ||
					content.extra[1]?.text == "fell into their own goal"
				) {
					const died = content.extra[0].text.trim();
					flashback.ensure_player(died);
					flashback.current_match.players[died]!.voids += 1;
				}
			}
		}
	},
	"minecraft:set_subtitle_text": async (flashback, reader) => {
		const content = reader.read_nbt<TextComponent>();
		if (
			content.extra &&
			content.extra.length == 2 &&
			content.extra[1]?.text == " won the Match!"
		) {
			flashback.end_match();
		}
	},
};

const CHUNK_CACHE_SIZE = 10000;

export const ActionParsers: Record<
	string,
	(flasback: Flashback, reader: ByteReader) => Promise<void>
> = {
	"flashback:action/next_tick": async (flashback) => {
		flashback.tick += 1;
	},
	"flashback:action/game_packet": async (flashback, reader) => {
		const packet_id = reader.read_varint();
		const packet_name = play_packets[packet_id];
		if (packet_name == undefined) return;

		const packet_data = reader.remaining_buffer();

		const parser = PacketParsers[packet_name];
		if (parser != undefined) {
			await parser.call(flashback, flashback, new ByteReader(packet_data));
		}
	},
	"flashback:action/level_chunk_cached": async (flashback, reader) => {
		const num = reader.read_varint();
		console.log(num);
		await flashback.get_chunk(num);
	},
};

export type MatchState = {
	start_tick: number;
	end_tick: number;
	players: Record<string, MatchPlayerInsertData>;
	map: string | undefined;
	winner: "Red" | "Blue";
};

export type Chunk = {
	x: number;
	y: number;
};

export type ChunkCache = {
	packets: Chunk[];
};

export default class Flashback {
	metadata: FlashbackMetadata = null!;

	tick: number = 0;

	reading_winners: boolean = false;
	reading_losers: boolean = false;

	reading_game: boolean = false;

	matches: FullMatchInsertData[] = [];
	current_match: MatchState | null = null;

	date: number = 0;

	chunk_cache: Record<number, ChunkCache> = {};

	zip: JSZip | null = null;

	constructor(date: number) {
		this.date = date;
	}

	start_match(match: MatchState) {
		this.current_match = match;
	}

	ensure_player(name: string) {
		if (this.current_match) {
			if (this.current_match.players[name] == undefined) {
				this.current_match.players[name] = {
					username: name,
					team: Team.BLUE,
					deaths: 0,
					scores: 0,
					kills: 0,
					voids: 0,
				};
			}
		}
	}

	end_match() {
		if (this.current_match != null) {
			this.current_match.end_tick = this.tick;

			const red_players = Object.values(this.current_match.players).filter(
				(v) => v.team == Team.RED,
			);
			const blue_players = Object.values(this.current_match.players).filter(
				(v) => v.team == Team.BLUE,
			);

			const data: FullMatchInsertData = {
				duration: (this.current_match.end_tick - this.current_match.start_tick) / 20,
				map: this.current_match.map ?? "Null",
				red_players: red_players,
				blue_players: blue_players,
				date: this.date,
			};
			this.matches.push(data);
		}
		this.current_match = null;
	}

	async get_chunk(index: number) {
		const cache_id = Math.floor(index / CHUNK_CACHE_SIZE);
		const cache = await this.get_cache(cache_id);

		const index_in_cache = index - cache_id * CHUNK_CACHE_SIZE;

		if (cache.packets[index_in_cache] == undefined) {
			throw new Error("Missing chunk " + index);
		}

		console.log(cache.packets[index_in_cache]);
	}

	async get_cache(cache_id: number): Promise<ChunkCache> {
		const cache = this.chunk_cache[cache_id];
		if (cache == undefined) {
			console.log("Cache miss on " + cache_id.toString());
			if (this.zip == null) throw new Error("Zip file missing");
			const file = await this.zip.file("level_chunk_caches/" + cache_id.toString());
			if (file == null) {
				throw new Error("Chunk cache file missing.");
			}
			const raw = new Uint8Array(await file.async("arraybuffer"));
			const reader = new ByteReader(raw);
			const packets: Chunk[] = [];

			while (true) {
				if (!reader.has(4)) {
					break;
				}

				const size = reader.read_int();
				console.log(size);

				reader.position -= 4;

				const chunk = new ByteReader(reader.take(size + 4));

				chunk.read_int();

				chunk.read_varint();

				const chunk_res = {
					x: chunk.read_int(),
					y: chunk.read_int(),
				};

				const len = chunk.read_varint();

				for (let i = 0; i < len; i++) {
					const type = chunk.read_varint();
					const length = chunk.read_varint();

					for (let j = 0; j < length; j++) {
						const long = chunk.read_long();
					}
				}

				const data_length = chunk.read_varint();

				for (let i = 0; i < 24; i++) {
					const block_count = chunk.read_short();
					console.log(block_count, "blocks.");
					chunk.read_block_data();
					chunk.read_biome_data();
				}

				packets.push(chunk_res);
			}

			const res: ChunkCache = {
				packets: packets,
			};
			this.chunk_cache[cache_id] = res;
			return res;
		} else {
			return cache;
		}
	}

	async findGames(input: Uint8Array): Promise<FullMatchInsertData[]> {
		const zip = new JSZip();

		this.zip = zip;

		await zip.loadAsync(input);

		const metadata_file = zip.file("metadata.json");

		if (metadata_file == null) {
			throw new Error("Couldnt read flashback metadata.");
		}

		try {
			this.metadata = JSON.parse(await metadata_file.async("string"));
		} catch {}

		if (this.metadata == null) {
			return [];
			//throw new Error("Couldnt read flashback metadata.");
		}

		if (
			this.metadata.version_string != SUPPORTED_VERSION_STRING ||
			this.metadata.data_version != SUPPORTED_DATA_VERSION ||
			this.metadata.protocol_version != SUPPORTED_PROTOCOL_VERSION
		) {
			throw new Error(
				`Unsupported flashback or game version. Please use ${SUPPORTED_VERSION_STRING}`,
			);
		}

		const chunks: string[] = Object.keys(this.metadata.chunks);

		for (const chunk_name of chunks) {
			const chunk_file = zip.file(chunk_name);
			if (chunk_file == null) {
				throw new Error(`Flashback file missing chunk file: ${chunk_name}`);
			}
			const chunk_data = await chunk_file.async("arraybuffer");

			const reader = new ByteReader(new Uint8Array(chunk_data));

			const magic = reader.read_uint();
			if (magic != CHUNK_MAGIC) {
				throw new Error(
					`Invalid chunk magic in ${chunk_name} got ${magic} expected ${CHUNK_MAGIC}`,
				);
			}

			const action_count = reader.read_varint();

			const action_types: string[] = [];

			for (let i = 0; i < action_count; i++) {
				action_types.push(reader.read_string());
			}

			const size = reader.read_int();
			if (size < 0) {
				throw new Error("Invalid chunk size.");
			}

			const offset = reader.position;
			reader.skip(size);
			const actions_offset = reader.position;

			reader.position = offset;

			const actions: {
				action: string;
				data: Uint8Array;
			}[] = [];

			while (reader.position < actions_offset) {
				const type_id = reader.read_varint();
				const action_type = action_types[type_id];

				if (action_type == undefined) {
					throw new Error(`Invalid action type ${type_id}`);
				}

				const action_size = reader.read_int();
				const data = reader.take(action_size);
				actions.push({
					action: action_type,
					data: data,
				});
			}

			if (reader.position < actions_offset) {
				reader.position = actions_offset;
			}
			while (reader.position < reader.length) {
				const type_id = reader.read_varint();
				const action_type = action_types[type_id];

				if (action_type == undefined) {
					throw new Error(`Invalid action type ${type_id}`);
				}

				const action_size = reader.read_int();
				const data = reader.take(action_size);
				actions.push({
					action: action_type,
					data: data,
				});
			}

			for (const action of actions) {
				const parser = ActionParsers[action.action];
				if (parser != undefined) {
					await parser.call(this, this, new ByteReader(action.data));
				}
			}
		}

		return this.matches;
	}
}
