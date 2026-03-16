import { createContext, useContext } from "react";

export function isNative(): boolean {
	return typeof window !== "undefined" && "__electrobunWindowId" in window;
}

export type NativeContextType =
	| {
			isNative: true;
	  }
	| {
			isNative: false;
	  };

export const NativeContext = createContext<NativeContextType | null>(null);

export function useNative(): NativeContextType {
	const ctx = useContext(NativeContext);
	if (!isNative()) {
		return {
			isNative: false,
		};
	}

	if (ctx == null) {
		return {
			isNative: false,
		};
	}

	return ctx;
}
