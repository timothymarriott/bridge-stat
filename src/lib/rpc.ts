import { RPCSchema } from "electrobun/view";

export interface NativeRPCType {
	bun: RPCSchema<object>;
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
}
