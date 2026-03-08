import { RPCSchema } from "electrobun/view";

export type NativeRPCType = {
	bun: RPCSchema<{}>;
	webview: RPCSchema<{
		requests: {
			onReplayAdded: {
				params: {
					data: string;
					path: string;
				};
				response: string;
			};
		};
	}>;
};
