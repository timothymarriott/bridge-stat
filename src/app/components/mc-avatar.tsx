import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import React from "react";
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
				<InternalAvatarComponent uuid={uuid} size={size}></InternalAvatarComponent>
			</TooltipTrigger>
			<TooltipContent side="left">{tooltip}</TooltipContent>
		</Tooltip>
	) : (
		<InternalAvatarComponent uuid={uuid} size={size}></InternalAvatarComponent>
	);
}

const InternalAvatarComponent = React.memo(InternalAvatar);

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
