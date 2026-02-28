import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export default function MinecraftAvatar({
	uuid,
	size,
	tooltip,
}: {
	uuid: string;
	size?: string;
	tooltip?: string;
}) {
	return tooltip != undefined ? (
		<Tooltip>
			<TooltipTrigger>
				<InternalAvatar uuid={uuid} size={size}></InternalAvatar>
			</TooltipTrigger>
			<TooltipContent side="left">
				<p>{tooltip}</p>
			</TooltipContent>
		</Tooltip>
	) : (
		<InternalAvatar uuid={uuid} size={size}></InternalAvatar>
	);
}

function InternalAvatar({ uuid, size }: { uuid: string; size?: string }) {
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
