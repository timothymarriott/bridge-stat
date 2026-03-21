import { NativeRPCType } from "@/lib/rpc";
import { Electroview } from "electrobun/view";
import { ReactNode } from "react";
import { isNative, NativeContext } from "./context";

export function NativeProvider({ children }: { children: ReactNode }) {
	if (isNative()) {
		Electroview.defineRPC<NativeRPCType>({
			handlers: {
				requests: {},
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
