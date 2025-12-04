import { Bot, LayoutDashboard, LogOut, Mail, User } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { authClient } from "@/lib/auth-client";
import { Button } from "./ui/button";
import { Skeleton } from "./ui/skeleton";

export default function UserMenu() {
	const router = useRouter();
	const { data: session, isPending } = authClient.useSession();

	if (isPending) {
		return <Skeleton className="h-9 w-24" />;
	}

	if (!session) {
		return (
			<Button variant="outline" asChild>
				<Link href="/login">Sign In</Link>
			</Button>
		);
	}

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button variant="outline" className="gap-2">
					<User className="h-4 w-4" />
					{session.user.name}
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent className="w-56 bg-card" align="end">
				{/* Account Section */}
				<DropdownMenuLabel>My Account</DropdownMenuLabel>
				<DropdownMenuItem className="gap-2">
					<Mail className="h-4 w-4 text-muted-foreground" />
					<span className="truncate">{session.user.email}</span>
				</DropdownMenuItem>

				<DropdownMenuSeparator />

				{/* Navigation Section */}
				<DropdownMenuLabel className="text-muted-foreground text-xs">
					Navigation
				</DropdownMenuLabel>
				<DropdownMenuItem asChild className="cursor-pointer gap-2">
					<Link href="/dashboard">
						<LayoutDashboard className="h-4 w-4" />
						Dashboard
					</Link>
				</DropdownMenuItem>
				<DropdownMenuItem asChild className="cursor-pointer gap-2">
					<Link href="/ai">
						<Bot className="h-4 w-4" />
						AI Chat
					</Link>
				</DropdownMenuItem>

				<DropdownMenuSeparator />

				{/* Sign Out */}
				<DropdownMenuItem
					className="cursor-pointer gap-2 text-destructive focus:text-destructive"
					onClick={() => {
						authClient.signOut({
							fetchOptions: {
								onSuccess: () => {
									router.push("/");
								},
							},
						});
					}}
				>
					<LogOut className="h-4 w-4" />
					Sign Out
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
