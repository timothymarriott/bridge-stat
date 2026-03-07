import type { NativeRPCType } from "@/lib/rpc";
import { BrowserView, BrowserWindow } from "electrobun/bun";
import { watch } from "fs";

const webviewRpc = BrowserView.defineRPC<NativeRPCType>({
	maxRequestTime: 5000,
	handlers: {},
});

const mainWindow = new BrowserWindow({
	title: "Bridge Stats",
	url: "http://localhost:5173",
	frame: {
		width: 10,
		height: 10,
		x: 200,
		y: 200,
	},
	styleMask: {
		FullSizeContentView: true,
	},
	titleBarStyle: "default",
	renderer: "cef",
	rpc: webviewRpc,
});

mainWindow.setSize(1920 / 2, 1080 / 2 + 28);

const SEARCH_DIR = "/Users/timothymarriott/test";

const watcher = watch(SEARCH_DIR, { recursive: true }, async (event, filename) => {
	console.log(`Detected ${event} in ${SEARCH_DIR}/${filename}`);

	const file = Bun.file(`${SEARCH_DIR}/${filename}`);

	if (await file.exists()) {
		const stat = await file.stat();
		if (stat.isFile()) {
			mainWindow.webview.rpc?.request.onReplayAdded({
				data: new Uint8Array(await file.arrayBuffer()),
			});
		}
	}
});

process.on("SIGINT", () => {
	console.log("Closing watcher...");
	watcher.close();

	process.exit(0);
});
