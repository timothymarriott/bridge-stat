import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { UserInformation, UserProfile } from "@/worker/types";
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
import { adminLinkRequestsQuery, adminUsersQuery, authQuery } from "../queries";
import { Button } from "@/components/ui/button";
import { Link2OffIcon, TrashIcon } from "lucide-react";
import { queryClient } from "../router";
import { proxy } from "@/lib/utils";
import { useQueryData } from "../auth-hooks";

export default function UserList() {
	const users = useQueryData(adminUsersQuery, []);

	const columns: ColumnDef<UserInformation>[] = [
		{
			header: "User",
			cell: ({ row }) => {
				const value: UserInformation = row.original;
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
			header: "Minecraft Account",
			cell: ({ row }) => {
				const target: UserProfile = row.original;
				return (
					<div className="flex-1 gap-2 flex flex-row w-full size-10">
						{target.uuid != null ? (
							<>
								<div className="size-10 p-1">
									<MinecraftAvatar uuid={target.uuid} />
								</div>
								<div className="flex flex-col justify-around align-middle">
									<p className=" font-bold">{target.username}</p>
									<p className=" text-xs text-muted-foreground">{target.uuid}</p>
								</div>
							</>
						) : (
							<div className="w-full h-full flex items-center justify-around">
								<span className="text-muted-foreground">No Account Linked</span>
							</div>
						)}
					</div>
				);
			},
		},
		{
			header: "Action",
			cell: ({ row }) => {
				const me = users[row.index];
				return (
					<div className="flex-1 gap-2 flex flex-row w-full size-10 items-center">
						{me.uuid != null ? (
							<Button
								onClick={() => {
									void (async () => {
										await fetch("/api/admin/link/unlink/" + me.id, {
											credentials: "include",
											method: "POST",
										});
										await Promise.all([
											queryClient.refetchQueries(adminUsersQuery),
											queryClient.refetchQueries(adminLinkRequestsQuery),
											queryClient.refetchQueries(authQuery),
										]);
									})();
								}}
								variant={"destructive"}
							>
								<Link2OffIcon /> Unlink
							</Button>
						) : (
							<Button
								onClick={() => {
									void (async () => {
										await fetch("/api/admin/link/unlink/" + me.id, {
											credentials: "include",
											method: "POST",
										});
										await Promise.all([
											queryClient.refetchQueries(adminUsersQuery),
											queryClient.refetchQueries(adminLinkRequestsQuery),
											queryClient.refetchQueries(authQuery),
										]);
									})();
								}}
								variant={"destructive"}
							>
								<TrashIcon /> Delete
							</Button>
						)}
					</div>
				);
			},
		},
	];

	const table = useReactTable({
		data: users,
		columns: columns,
		getCoreRowModel: getCoreRowModel(),
	});

	return (
		<Card className="ring-sidebar-border rounded-lg">
			<CardHeader>
				<CardTitle>Users</CardTitle>
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
						{table.getRowModel().rows.length ? (
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
									No Users.
								</TableCell>
							</TableRow>
						)}
					</TableBody>
				</Table>
			</CardContent>
		</Card>
	);
}
