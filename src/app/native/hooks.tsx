import { NativeRPCType } from "@/lib/rpc";
import { Electroview } from "electrobun/view";
import { ReactNode } from "react";
import Flashback from "../../lib/flashback";
import { isNative, NativeContext } from "./context";

export function NativeProvider({ children }: { children: ReactNode }) {
	if (isNative()) {
		Electroview.defineRPC<NativeRPCType>({
			handlers: {
				requests: {
					onReplayAdded: async ({ data }) => {
						const binaryString = atob(data);
						const bytes = new Uint8Array(binaryString.length);
						for (let i = 0; i < binaryString.length; i++) {
							bytes[i] = binaryString.charCodeAt(i);
						}

						if (bytes.length >= 2 && bytes[0] == 80 && bytes[1] == 75) {
							const flashback = new Flashback(new Date().getTime());
							const res = await flashback.findGames(bytes);

							for (const match of res) {
								match.red_players.forEach((v) => {
									v.username = v.username
										.replace("trianglepoger", "trianglepoger1")
										.replace("JoeBartLover", "TheMoon021")
										.replace("Jordano120", "Tetron_");
								});

								match.blue_players.forEach((v) => {
									v.username = v.username
										.replace("trianglepoger", "trianglepoger1")
										.replace("JoeBartLover", "TheMoon021")
										.replace("Jordano120", "Tetron_");
								});
								await fetch("/api/admin/upload", {
									credentials: "include",
									method: "POST",
									body: JSON.stringify(match),
								});
							}
						}

						return "It worked.";
					},
				},
			},
		});

		return (
			<NativeContext.Provider
				value={{
					isNative: true,
				}}
			>
				{children}
			</NativeContext.Provider>
		);
	} else {
		return children;
	}
}
