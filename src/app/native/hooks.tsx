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
