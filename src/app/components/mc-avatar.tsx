import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ReactNode } from "react";

export default function MinecraftAvatar({
	uuid,
	size,
	tooltip,
}: {
	uuid: string;
	size?: string;
	tooltip?: ReactNode;
}) {
	return tooltip != undefined ? (
		<Tooltip disableHoverableContent>
			<TooltipTrigger>
				<InternalAvatar uuid={uuid} size={size}></InternalAvatar>
			</TooltipTrigger>
			<TooltipContent side="left">{tooltip}</TooltipContent>
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
