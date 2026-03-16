export const NbtType: Record<number, keyof NbtTypeNames> = {
	0: "end",
	1: "byte",
	2: "short",
	3: "int",
	4: "long",
	5: "float",
	6: "double",
	7: "byte_array",
	8: "string",
	9: "list",
	10: "compound",
	11: "int_array",
	12: "long_array",
};

export interface NbtTypeNames {
	end: 0;
	byte: 1;
	short: 2;
	int: 3;
	long: 4;
	float: 5;
	double: 6;
	byte_array: 7;
	string: 8;
	list: 9;
	compound: 10;
	int_array: 11;
	long_array: 12;
}

type NbtPrimitive =
	| { type: "end"; value: undefined }
	| { type: "byte"; value: number }
	| { type: "short"; value: number }
	| { type: "int"; value: number }
	| { type: "long"; value: bigint }
	| { type: "float"; value: number }
	| { type: "double"; value: number }
	| { type: "byte_array"; value: number[] }
	| { type: "string"; value: string }
	| { type: "int_array"; value: number[] }
	| { type: "long_array"; value: bigint[] };

interface NbtCompound {
	type: "compound";
	value: Record<string, NbtTag>;
}

interface NbtList {
	type: "list";
	value: NbtTag[];
}

type NbtUnwrapped = number | bigint | string | NbtUnwrapped[] | { [key: string]: NbtUnwrapped };

type NbtTag = NbtPrimitive | NbtCompound | NbtList;

function unwrapNbt(tag: NbtTag): NbtUnwrapped {
	switch (tag.type) {
		case "end":
			return undefined as never;

		case "byte":
		case "short":
		case "int":
		case "float":
		case "double":
			return tag.value;

		case "long":
			return tag.value;

		case "string":
			return tag.value;

		case "byte_array":
		case "int_array":
			return tag.value;

		case "long_array":
			return tag.value;

		case "list":
			return tag.value.map(unwrapNbt);

		case "compound": {
			const out: Record<string, NbtUnwrapped> = {};
			for (const [key, value] of Object.entries(tag.value)) {
				out[key] = unwrapNbt(value);
			}
			return out;
		}

		default: {
			throw new Error("Unknown NBT tag");
		}
	}
}

export class ByteReader {
	static readonly SEGMENT_BITS = 0x7f;
	static readonly CONTINUE_BIT = 0x80;

	private view: DataView;
	private bytes: Uint8Array;
	private pos = 0;

	public get position(): number {
		return this.pos;
	}

	public set position(v: number) {
		this.pos = v;
	}

	public get length(): number {
		return this.bytes.length;
	}

	constructor(buffer: Uint8Array) {
		this.bytes = buffer;
		this.view = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength);
	}

	private ensure(n: number) {
		if (this.pos + n > this.bytes.length) {
			throw new Error("Unexpected end of data");
		}
	}

	has(n: number) {
		if (this.pos + n > this.bytes.length) {
			return false;
		}
		return true;
	}

	take(n: number): Uint8Array {
		this.ensure(n);
		const out = this.bytes.subarray(this.pos, this.pos + n);
		this.pos += n;
		return out;
	}

	peek(n: number): Uint8Array {
		this.ensure(n);
		const out = this.bytes.subarray(this.pos, this.pos + n);
		return out;
	}

	skip(n: number): void {
		this.ensure(n);
		this.pos += n;
	}

	read_byte(): number {
		this.ensure(1);
		const out = this.bytes[this.pos];
		this.pos += 1;
		return out;
	}

	remaining_buffer(): Uint8Array {
		return this.bytes.subarray(this.pos);
	}

	read_u8(): number {
		return this.read_byte();
	}

	read_short(): number {
		this.ensure(2);
		const v = this.view.getInt16(this.pos, false);
		this.pos += 2;
		return v;
	}

	read_ushort(): number {
		this.ensure(2);
		const v = this.view.getUint16(this.pos, false);
		this.pos += 2;
		return v;
	}

	read_int(): number {
		this.ensure(4);
		const v = this.view.getInt32(this.pos, false);
		this.pos += 4;
		return v;
	}

	read_uint(): number {
		this.ensure(4);
		const v = this.view.getUint32(this.pos, false);
		this.pos += 4;
		return v;
	}

	read_long(): bigint {
		this.ensure(8);
		const hi = BigInt(this.view.getInt32(this.pos, false));
		const lo = BigInt(this.view.getUint32(this.pos + 4, false));
		this.pos += 8;
		return (hi << 32n) | lo;
	}

	read_bool(): boolean {
		return this.read_byte() > 0;
	}

	read_uuid(): string {
		const bytes = this.take(16);
		return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
	}

	read_varint(): number {
		let value = 0;
		let position = 0;

		for (;;) {
			const current = this.read_byte();
			value |= (current & ByteReader.SEGMENT_BITS) << position;

			if ((current & ByteReader.CONTINUE_BIT) === 0) break;

			position += 7;
			if (position >= 32) {
				throw new Error("VarInt is too big");
			}
		}

		// signed conversion
		if (value & (1 << 31)) {
			value -= 1 << 32;
		}

		return value;
	}

	read_varlong(): bigint {
		let value = 0n;
		let position = 0n;

		for (;;) {
			const current = BigInt(this.read_byte());
			value |= (current & 0x7fn) << position;

			if ((current & 0x80n) === 0n) break;

			position += 7n;
			if (position >= 64n) {
				throw new Error("VarLong is too big");
			}
		}

		if (value & (1n << 63n)) {
			value -= 1n << 64n;
		}

		return value;
	}

	read_float(): number {
		this.ensure(4);
		const v = this.view.getFloat32(this.pos, false);
		this.pos += 4;
		return v;
	}

	read_double(): number {
		this.ensure(8);
		const v = this.view.getFloat64(this.pos, false);
		this.pos += 8;
		return v;
	}

	read_float16(): number {
		const h = this.read_ushort();

		const sign = h & 0x8000 ? -1 : 1;
		const exp = (h >> 10) & 0x1f;
		const frac = h & 0x3ff;

		if (exp === 0) {
			return sign * Math.pow(2, -14) * (frac / 1024);
		}

		if (exp === 31) {
			return frac ? NaN : sign * Infinity;
		}

		return sign * Math.pow(2, exp - 15) * (1 + frac / 1024);
	}

	read_string(): string {
		const length = this.read_varint();
		const bytes = this.take(length);
		return new TextDecoder().decode(bytes);
	}

	read_string_fixed(length: number): string {
		const bytes = this.take(length);
		return new TextDecoder().decode(bytes);
	}

	read_position(): [number, number, number] {
		const val = this.read_long();

		let x = Number(val >> 38n);
		let z = Number((val >> 12n) & 0x3ffffffn);
		let y = Number(val & 0xfffn);

		if (x & (1 << 25)) x -= 1 << 26;
		if (z & (1 << 25)) z -= 1 << 26;
		if (y & (1 << 11)) y -= 1 << 12;

		return [x, y, z];
	}

	read_lpvec3(): [number, number, number] {
		const MAX = 32766.0;

		const unpack = (v: number) => (Math.min(v & 0x7fff, MAX) * 2.0) / MAX - 1.0;

		const b1 = this.read_u8();
		if (b1 === 0) return [0, 0, 0];

		const b2 = this.read_u8();
		const b3to6 = this.read_uint();

		const packed = (b3to6 << 16) | (b2 << 8) | b1;

		const scale = b1 & 0b11;

		const x = unpack(packed >> 3) * scale;
		const y = unpack(packed >> 18) * scale;
		const z = unpack(packed >> 33) * scale;

		return [x, y, z];
	}

	read_nbt(): unknown {
		const item_type = this.read_byte();
		const item_type_name = NbtType[item_type];

		const nbt = this.read_nbt_tag(item_type_name);

		return unwrapNbt(nbt) as unknown;
	}

	read_nbt_tag(type: keyof NbtTypeNames): NbtTag {
		if (type == "end") {
			throw new Error("Invaid end tag position.");
		} else if (type == "byte") {
			return { type, value: this.read_byte() };
		} else if (type == "short") {
			return { type, value: this.read_short() };
		} else if (type == "int") {
			return { type, value: this.read_int() };
		} else if (type == "long") {
			return { type, value: this.read_long() };
		} else if (type == "float") {
			return { type, value: this.read_float() };
		} else if (type == "double") {
			return { type, value: this.read_double() };
		} else if (type == "byte_array") {
			const len = this.read_int();
			const res: number[] = [];
			for (let i = 0; i < len; i++) {
				res.push(this.read_byte());
			}
			return { type, value: res };
		} else if (type == "string") {
			const len = this.read_ushort();
			return { type, value: new TextDecoder().decode(this.take(len)) };
		} else if (type == "list") {
			const item_type = this.read_byte();
			const item_type_name = NbtType[item_type];

			const len = this.read_int();

			if (item_type <= 0) {
				return { type, value: [] };
			}

			const res: NbtTag[] = [];

			for (let i = 0; i < len; i++) {
				res.push(this.read_nbt_tag(item_type_name));
			}

			return { type, value: res };
		} else if (type == "compound") {
			const res: NbtCompound = {
				type,
				value: {},
			};

			for (;;) {
				const item_type = this.read_byte();
				const item_type_name = NbtType[item_type];
				if (item_type == 0) {
					break;
				}

				const name_len = this.read_ushort();
				const name = new TextDecoder().decode(this.take(name_len));
				const value = this.read_nbt_tag(item_type_name);
				res.value[name] = value;
			}

			return res;
		} else if (type == "int_array") {
			const len = this.read_int();
			const res: number[] = [];
			for (let i = 0; i < len; i++) {
				res.push(this.read_int());
			}
			return { type, value: res };
		} else {
			const len = this.read_int();
			const res: bigint[] = [];
			for (let i = 0; i < len; i++) {
				res.push(this.read_long());
			}
			return { type, value: res };
		}
	}
}
