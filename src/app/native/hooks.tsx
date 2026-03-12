import { NativeRPCType } from "@/lib/rpc";
import { Electroview } from "electrobun/view";
import { createContext, useContext, ReactNode } from "react";
import Flashback from "../../lib/flashback";

type NativeContextType =
	| {
			isNative: true;
	  }
	| {
			isNative: false;
	  };

export const NativeContext = createContext<NativeContextType | null>(null);

export function NativeProvider({ children }: { children: ReactNode }) {
	if (isNative()) {
		const rpc = Electroview.defineRPC<NativeRPCType>({
			handlers: {
				requests: {
					onReplayAdded: async ({ data, path }) => {
						var binaryString = atob(data);
						var bytes = new Uint8Array(binaryString.length);
						for (var i = 0; i < binaryString.length; i++) {
							bytes[i] = binaryString.charCodeAt(i);
						}

						if (bytes.length >= 2 && bytes[0] == 80 && bytes[1] == 75) {
							console.log("Uploaded replay");
							const flashback = new Flashback(new Date().getTime());
							const res = await flashback.findGames(bytes);

							for (const match of res) {
								match.red_players.forEach((v) => {
									v.username = v.username
										.replace("JoeBartLover", "TheMoon021")
										.replace("Jordano120", "Tetron_");
								});

								match.blue_players.forEach((v) => {
									v.username = v.username
										.replace("JoeBartLover", "TheMoon021")
										.replace("Jordano120", "Tetron_");
								});
								await fetch("/api/admin/upload", {
									credentials: "include",
									method: "POST",
									body: JSON.stringify(match),
								});
							}

							console.log(res);
						}

						console.log(path, bytes);
						return "It worked.";
					},
				},
			},
		});
		const electroview = new Electroview({ rpc });

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

function isNative(): boolean {
	return typeof window !== "undefined" && (window as any).__electrobunWindowId != undefined;
}
export function useNative(): NativeContextType {
	if (!isNative()) {
		return {
			isNative: false,
		};
	}
	const ctx = useContext(NativeContext);

	if (ctx == null) {
		return {
			isNative: false,
		};
	}

	return ctx;
}
