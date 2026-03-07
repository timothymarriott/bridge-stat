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
		width: 1920,
		height: 1081,
		x: 200,
		y: 200,
	},
	styleMask: {
		FullSizeContentView: true,

	},
	titleBarStyle: "default",
	rpc: webviewRpc,
});


mainWindow.setSize(1920, 1080)

const SEARCH_DIR = "C:\\Users\\timot\\Documents\\FunTimes";

const watcher = watch(SEARCH_DIR, { recursive: true }, async (event, filename) => {
	console.log(`Detected ${event} in ${SEARCH_DIR}/${filename}`);

	if (event == "change"){
		setTimeout(async () => {
			const file = Bun.file(`${SEARCH_DIR}/${filename}`);

			if (await file.exists()) {
				const stat = await file.stat();
				if (stat.isFile()) {

					mainWindow.webview.rpc?.request.onReplayAdded({
						data: new Uint8Array(await file.arrayBuffer()).toBase64(),
						path: `${SEARCH_DIR}/${filename}`
					});
				}
			}
		}, 100);
	}


});

process.on("SIGINT", () => {
	console.log("Closing watcher...");
	watcher.close();

	process.exit(0);
});
