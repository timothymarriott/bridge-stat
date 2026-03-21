import { TextComponent } from "@/lib/flashback";

const COLOR_MAP: Record<string, string> = {
	black: "#000000",
	dark_blue: "#0000AA",
	dark_green: "#00AA00",
	dark_aqua: "#00AAAA",
	dark_red: "#AA0000",
	dark_purple: "#AA00AA",
	gold: "#FFAA00",
	gray: "#AAAAAA",
	dark_gray: "#555555",
	blue: "#5555FF",
	green: "#55FF55",
	aqua: "#55FFFF",
	red: "#FF5555",
	light_purple: "#FF55FF",
	yellow: "#FFFF55",
	white: "#FFFFFF",
};

function toHexColor(color: string): string {
	return COLOR_MAP[color] ?? color;
}

export function TextComponentRenderer({ content }: { content: TextComponent }) {
	return (
		<span>
			<span
				style={{
					color: content.color ? toHexColor(content.color) : "inherit",
					fontFamily: "Monocraft",
				}}
			>
				{content.text ?? null}
			</span>
			{content.extra?.map((extra) => {
				return <TextComponentRenderer content={extra} />;
			})}
		</span>
	);
}
