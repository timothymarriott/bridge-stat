import JSZip from "jszip";
import { ByteReader } from "./byteReader";

import rawpackets from "./packets.json";
import { FullMatchInsertData, MatchPlayerInsertData, Team } from "@/worker/types";
import { Awaitable } from "better-auth";

export interface PacketGroup {
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
}

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

	play_packets[v.protocol_id] = key;
});

export interface FlashbackChunkMetadata {
	duration: number;
	forcePlaySnapshot: boolean;
}

export interface FlashbackMetadata {
	uuid: string;
	name: string;
	version_string: string;
	custom_flashback_version?: 1;
	world_name?: string;
	data_version: number;
	protocol_version: number;
	total_ticks: number;
	customNamespacesForRegistries: object;
	chunks: Record<string, FlashbackChunkMetadata>;
}

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

	click_event?: object;

	hover_event?: object;
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

export type PacketParser = (flashback: Flashback, reader: ByteReader) => Promise<void> | void;

export const PacketParsers: Record<string, PacketParser | undefined> = {
	"minecraft:system_chat": (flashback, reader) => {
		const content = reader.read_nbt() as TextComponent;

		if (content.extra) {
			if (flashback.reading_winners && flashback.current_match != null) {
				flashback.reading_winners = false;

				const winners: string[] = [];
				for (const element of content.extra) {
					if (element.click_event && element.text) {
						flashback.ensure_player(element.text.trim());
						flashback.current_match.players[element.text.trim()].team =
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
						flashback.current_match.players[element.text.trim()].team =
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
					/*
					if (content.extra[0].text == "Bridge Duel") {
						flashback.start_match({
							start_tick: flashback.tick,
							end_tick: -1,
							map: undefined,
							players: {},
							winner: "Blue",
						});
					}*/
				}

				if (content.extra[0].text == "5") {
					flashback.could_be_bridge = true;
				}

				if (content.extra[0].text == "Match started!") {
					flashback.could_be_bridge = true;
				}

				if (content.extra[0].text == "Bridge" && flashback.could_be_bridge) {
					flashback.could_be_bridge = false;
					//console.log("Detected Party Split Game");
					//000002bf-00000000-00005031-1f3262844d54bc350717a2fea393669c
					flashback.start_match({
						start_tick: flashback.tick,
						end_tick: -1,
						map: flashback.last_map,
						players: {},
						winner: "Blue",
					});
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
						flashback.current_match.players[plr].scores += 1;
					}
				}

				if (content.extra[0]?.color && content.extra[2]?.color) {
					if (
						((content.extra[0].color == "red" && content.extra[2].color == "blue") ||
							(content.extra[0].color == "blue" &&
								content.extra[2].color == "red")) &&
						content.extra[0].text &&
						content.extra[2].text
					) {
						const died = content.extra[0].text.trim();
						const killer = content.extra[2].text.trim();

						if (flashback.current_match) {
							flashback.ensure_player(died);
							flashback.current_match.players[died].deaths += 1;
							flashback.ensure_player(killer);
							flashback.current_match.players[killer].kills += 1;
						}
					}
				}
			}

			if (content.extra.length >= 4) {
				if (content.extra[2]?.text == " Map: " && content.extra[3]?.text) {
					if (flashback.current_match && flashback.current_match.map == undefined) {
						flashback.current_match.map = content.extra[3].text;
					}
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
					flashback.current_match.players[died].voids += 1;
				}
			}
		}

		flashback.callbacks.onChatMessage(content);
	},
	"minecraft:set_subtitle_text": async (flashback, reader) => {
		const content = reader.read_nbt() as TextComponent;
		if (content.extra?.length == 2 && content.extra[1]?.text == " won the Match!") {
			await flashback.end_match();
		}
	},
};

export const ActionParsers: Record<string, PacketParser | undefined> = {
	"flashback:action/next_tick": (flashback, reader) => {
		flashback.tick += 1;
		if (flashback.metadata?.custom_flashback_version != undefined) {
			const time = reader.read_long();
			if (flashback.tick == 1) {
				flashback.start_time = Number(time);
			}
			flashback.callbacks.onTick(Number(time));
		} else {
			flashback.callbacks.onTick(flashback.start_time + flashback.tick * (1 / 20) * 1000);
		}
	},
	"flashback:action/game_packet": async (flashback, reader) => {
		const packet_id = reader.read_varint();
		const packet_name = play_packets[packet_id];
		const packet_data = reader.remaining_buffer();

		const parser = PacketParsers[packet_name];
		if (parser != undefined) {
			await parser.call(flashback, flashback, new ByteReader(packet_data));
		}
	},
};

export interface MatchState {
	start_tick: number;
	end_tick: number;
	players: Record<string, MatchPlayerInsertData>;
	map: string | undefined;
	winner: "Red" | "Blue";
}

export interface Chunk {
	x: number;
	y: number;
}

export interface ChunkCache {
	packets: Chunk[];
}

export default class Flashback {
	metadata: FlashbackMetadata | null = null;

	tick = 0;

	reading_winners = false;
	reading_losers = false;

	reading_game = false;

	matches: FullMatchInsertData[] = [];
	current_match: MatchState | null = null;

	start_time = 0;

	could_be_bridge = false;
	last_map: string | undefined = undefined;

	callbacks: {
		onChatMessage: (content: TextComponent) => void;
		onTick: (timestamp: number) => void;
		onMatch: (match: FullMatchInsertData) => Awaitable<void>;
	} = {
		onChatMessage: () => {
			/* empty */
		},
		onTick: () => {
			/* empty */
		},
		onMatch: () => {
			/* empty */
		},
	};

	zip: JSZip | null = null;

	constructor(time: number) {
		this.start_time = time;
	}

	start_match(match: MatchState) {
		this.current_match = match;
	}

	ensure_player(name: string) {
		if (this.current_match) {
			this.current_match.players[name] ??= {
				username: name,
				team: Team.BLUE,
				deaths: 0,
				scores: 0,
				kills: 0,
				voids: 0,
			};
		}
	}

	async end_match() {
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
				date: this.start_time,
			};
			this.matches.push(data);
			await this.callbacks.onMatch(data);
		}
		this.current_match = null;
	}

	async findGames(input: Uint8Array): Promise<FullMatchInsertData[]> {
		const zip = new JSZip();

		this.zip = zip;

		await zip.loadAsync(input);

		const metadata_file = zip.file("metadata.json");

		if (metadata_file == null) {
			console.error("Could not read flashback metadata.");
			return [];
		}

		try {
			this.metadata = JSON.parse(await metadata_file.async("string")) as FlashbackMetadata;
		} catch {
			this.metadata = null;
		}

		if (this.metadata == null) {
			console.error("Could not read flashback metadata.");
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

		performance.mark(this.metadata.uuid + "_start");

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
					`Invalid chunk magic in ${chunk_name} got ${magic.toString()} expected ${CHUNK_MAGIC.toString()}`,
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

		performance.mark(this.metadata.uuid + "_end");

		performance.measure(
			this.metadata.uuid,
			this.metadata.uuid + "_start",
			this.metadata.uuid + "_end",
		);

		return this.matches;
	}
}
