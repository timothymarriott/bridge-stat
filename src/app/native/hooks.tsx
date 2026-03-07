import { NativeRPCType } from "@/lib/rpc";
import { Electroview } from "electrobun/view";
import { createContext, useContext, ReactNode } from "react";

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
					onReplayAdded: ({data, path}) => {

						var binaryString = atob(data);
						var bytes = new Uint8Array(binaryString.length);
						for (var i = 0; i < binaryString.length; i++) {
							bytes[i] = binaryString.charCodeAt(i);
						}

						if (bytes.length >= 2 && bytes[0] == 80 && bytes[1] == 75){
							console.log("Uploaded replay", bytes)
						}

						console.log(path, bytes)
						return "It worked.";
					}
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
