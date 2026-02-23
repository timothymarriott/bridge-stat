import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export function proxy(url: string): string {
	return "https://mojang-proxy.timothyrmarriott.workers.dev/proxy/" + url;
}
