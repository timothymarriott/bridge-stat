import { RPCSchema } from "electrobun/view";

export type NativeRPCType = {
	bun: RPCSchema<{}>;
	webview: RPCSchema<{
		requests: {
			onReplayAdded: {
				params: {
					data: Uint8Array;
				};
				response: string;
			};
		};
	}>;
};
