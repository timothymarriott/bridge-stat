import Flashback from "@/lib/flashback";

const file = Bun.file("/Users/timothymarriott/Downloads/2026-02-13T22_36_46.zip");

const flashback = new Flashback(new Date().getTime());

console.log(await flashback.findGames(await file.bytes()));
