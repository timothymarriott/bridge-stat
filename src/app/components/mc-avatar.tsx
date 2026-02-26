import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";

export default function MinecraftAvatar({ uuid, size }: { uuid: string; size?: string }) {
	return (
		<Avatar className={"rounded-sm after:rounded-sm " + (size != undefined ? size : "")}>
			<AvatarFallback className="rounded-sm">
				<Skeleton className="size-full rounded-sm"></Skeleton>
			</AvatarFallback>
			<AvatarImage
				className="rounded-sm"
				src={"https://mojang-proxy.timothyrmarriott.workers.dev/avatar/" + uuid}
			></AvatarImage>
		</Avatar>
	);
}
