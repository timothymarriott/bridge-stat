import { useQuery } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { LinkRequestInfo, UserInformation } from "@/worker/types";
import { ColumnDef, flexRender, getCoreRowModel, useReactTable } from "@tanstack/react-table";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import MinecraftAvatar from "./mc-avatar";
import { Button } from "@/components/ui/button";
import { adminLinkRequestsQuery, adminUsersQuery, api_client, authQuery } from "../queries";
import { queryClient } from "../router";
import { proxy } from "@/lib/utils";

export default function LinkRequestList() {
	const link_requests = useQuery(adminLinkRequestsQuery);

	const columns: ColumnDef<LinkRequestInfo>[] = [
		{
			accessorKey: "user",
			header: "User",
			cell: ({ row }) => {
				const value: UserInformation = row.getValue("user");
				return (
					<div className="flex flex-row items-center space-x-2">
						<Avatar>
							<AvatarImage src={proxy(value.image ?? "")}></AvatarImage>
						</Avatar>
						<div className="font-bold">{value.name}</div>
					</div>
				);
			},
		},
		{
			accessorKey: "target",
			header: "Minecraft Account",
			cell: ({ row }) => {
				const target: {
					uuid: string;
					username: string;
				} = row.getValue("target");
				return (
					<div className="flex-1 gap-2 flex flex-row w-full size-10">
						<div className="size-10 p-1">
							<MinecraftAvatar uuid={target.uuid} />
						</div>
						<div className="flex flex-col justify-around align-middle">
							<p className=" font-bold">{target.username}</p>
							<p className=" text-xs text-muted-foreground">{target.uuid}</p>
						</div>
					</div>
				);
			},
		},
		{
			header: "Action",
			cell: ({ row }) => {
				const me = (link_requests.data ?? [])[row.index];
				if (me == undefined) return <></>;
				return (
					<div className="flex-1 gap-2 flex flex-row w-full size-10 items-center">
						<Button
							onClick={async () => {
								await api_client.api.admin.link.accept[":id"].$post({
									param: {
										id: me.user.id,
									},
								});
								await link_requests.refetch();
								await queryClient.refetchQueries(adminUsersQuery);
								await queryClient.refetchQueries(authQuery);
							}}
						>
							Accept
						</Button>
						<Button
							onClick={async () => {
								await api_client.api.admin.link.deny[":id"].$post({
									param: {
										id: me.user.id,
									},
								});
								await link_requests.refetch();
								await queryClient.refetchQueries(adminUsersQuery);
								await queryClient.refetchQueries(authQuery);
							}}
							variant={"destructive"}
						>
							Deny
						</Button>
					</div>
				);
			},
		},
	];

	const table = useReactTable({
		data: link_requests.data ?? [],
		columns: columns,
		getCoreRowModel: getCoreRowModel(),
	});

	return (
		<Card className="ring-sidebar-border rounded-lg">
			<CardHeader>
				<CardTitle>User Link Requests</CardTitle>
			</CardHeader>
			<CardContent>
				<Table>
					<TableHeader>
						{table.getHeaderGroups().map((headerGroup) => (
							<TableRow key={headerGroup.id}>
								{headerGroup.headers.map((header) => {
									return (
										<TableHead key={header.id}>
											{header.isPlaceholder
												? null
												: flexRender(
														header.column.columnDef.header,
														header.getContext(),
													)}
										</TableHead>
									);
								})}
							</TableRow>
						))}
					</TableHeader>
					<TableBody>
						{table.getRowModel().rows?.length ? (
							table.getRowModel().rows.map((row) => (
								<TableRow
									key={row.id}
									data-state={row.getIsSelected() && "selected"}
								>
									{row.getVisibleCells().map((cell) => (
										<TableCell key={cell.id}>
											{flexRender(
												cell.column.columnDef.cell,
												cell.getContext(),
											)}
										</TableCell>
									))}
								</TableRow>
							))
						) : (
							<TableRow>
								<TableCell colSpan={columns.length} className="h-24 text-center">
									No Requests.
								</TableCell>
							</TableRow>
						)}
					</TableBody>
				</Table>
			</CardContent>
		</Card>
	);
}
