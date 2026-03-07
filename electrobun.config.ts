import type { ElectrobunConfig } from "electrobun";

export default {
	app: {
		name: "bridge-stat",
		identifier: "com.timothymarriott.bridge-stat",
		version: "0.0.1",

	},



	build: {
		bun: {
			entrypoint: "src/native/index.ts",
		},
		views: {
			mainview: {
				entrypoint: "src/native/view.ts",
			},
		},
		copy: {},
		mac: {
			bundleCEF: false,
		},
		linux: {
			bundleCEF: false,
		},
		win: {
			bundleCEF: true,
			defaultRenderer: "cef"
		},
	},
} satisfies ElectrobunConfig;
