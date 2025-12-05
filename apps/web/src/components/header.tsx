"use client";

import type { LucideIcon } from "lucide-react";
import {
	BookOpen,
	Bot,
	Compass,
	LayoutDashboard,
	Library,
	Menu,
	Search,
	Tags,
	X,
} from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { ModeToggle } from "./mode-toggle";
import { BookSearchDialog } from "./search";
import { Button } from "./ui/button";
import UserMenu from "./user-menu";

interface NavLink {
	href: Route;
	label: string;
	icon: LucideIcon;
}

const navLinks: NavLink[] = [
	{ href: "/", label: "Home", icon: BookOpen },
	{ href: "/books", label: "Books", icon: Compass },
	{ href: "/shelves", label: "My Shelves", icon: Library },
	{ href: "/genres", label: "Genres", icon: Tags },
];

// Additional links shown only in mobile menu (in UserMenu on desktop)
const mobileOnlyLinks: NavLink[] = [
	{ href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
	{ href: "/ai", label: "AI Chat", icon: Bot },
];

export default function Header() {
	const pathname = usePathname();
	const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
	const [searchOpen, setSearchOpen] = useState(false);

	return (
		<header className="sticky top-0 z-50 w-full border-border border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
			<nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
				{/* Logo */}
				<Link href="/" className="flex items-center gap-2">
					<div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
						<BookOpen className="h-5 w-5" />
					</div>
					<span className="font-bold text-foreground text-xl tracking-tight">
						Bookmarkd
					</span>
				</Link>

				{/* Desktop Navigation */}
				<div className="hidden items-center gap-3 md:flex">
					{navLinks.map((link) => {
						const isActive =
							pathname === link.href ||
							(link.href !== "/" && pathname.startsWith(link.href));
						return (
							<Link
								key={link.href}
								href={link.href}
								className={cn(
									"flex items-center gap-2 rounded-lg px-4 py-2 font-medium text-sm transition-colors",
									isActive
										? "bg-primary text-primary-foreground"
										: "text-muted-foreground hover:bg-accent hover:text-foreground",
								)}
							>
								<link.icon className="h-4 w-4" />
								{link.label}
							</Link>
						);
					})}
				</div>

				{/* Desktop Actions */}
				<div className="hidden items-center gap-2 md:flex">
					<Button
						variant="ghost"
						size="icon"
						onClick={() => setSearchOpen(true)}
						className="text-muted-foreground"
					>
						<Search className="h-5 w-5" />
						<span className="sr-only">Search books</span>
					</Button>
					<ModeToggle />
					<UserMenu />
				</div>

				{/* Mobile Menu Button */}
				<div className="flex items-center gap-2 md:hidden">
					<Button
						variant="ghost"
						size="icon"
						onClick={() => setSearchOpen(true)}
						className="text-muted-foreground"
					>
						<Search className="h-5 w-5" />
						<span className="sr-only">Search books</span>
					</Button>
					<ModeToggle />
					<Button
						variant="ghost"
						size="icon"
						onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
					>
						{mobileMenuOpen ? (
							<X className="h-5 w-5" />
						) : (
							<Menu className="h-5 w-5" />
						)}
						<span className="sr-only">Toggle menu</span>
					</Button>
				</div>
			</nav>

			{/* Mobile Navigation */}
			{mobileMenuOpen && (
				<div className="border-border border-t bg-background md:hidden">
					<div className="mx-auto max-w-7xl space-y-1 px-4 py-3">
						{navLinks.map((link) => {
							const isActive =
								pathname === link.href ||
								(link.href !== "/" && pathname.startsWith(link.href));
							return (
								<Link
									key={link.href}
									href={link.href}
									onClick={() => setMobileMenuOpen(false)}
									className={cn(
										"flex items-center gap-3 rounded-lg px-3 py-2.5 font-medium text-sm transition-colors",
										isActive
											? "bg-primary text-primary-foreground"
											: "text-muted-foreground hover:bg-accent hover:text-foreground",
									)}
								>
									<link.icon className="h-5 w-5" />
									{link.label}
								</Link>
							);
						})}

						<div className="my-2 border-border border-t" />

						{/* Mobile-only links (Dashboard, AI Chat) */}
						{mobileOnlyLinks.map((link) => {
							const isActive =
								pathname === link.href ||
								(link.href !== "/" && pathname.startsWith(link.href));
							return (
								<Link
									key={link.href}
									href={link.href}
									onClick={() => setMobileMenuOpen(false)}
									className={cn(
										"flex items-center gap-3 rounded-lg px-3 py-2.5 font-medium text-sm transition-colors",
										isActive
											? "bg-primary text-primary-foreground"
											: "text-muted-foreground hover:bg-accent hover:text-foreground",
									)}
								>
									<link.icon className="h-5 w-5" />
									{link.label}
								</Link>
							);
						})}

						<div className="my-2 border-border border-t" />
						<div className="px-3 py-2">
							<UserMenu />
						</div>
					</div>
				</div>
			)}

			{/* Book Search Modal */}
			<BookSearchDialog open={searchOpen} onOpenChange={setSearchOpen} />
		</header>
	);
}
