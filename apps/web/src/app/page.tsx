import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { HomeContent } from "./home-content";

export default async function HomePage() {
	const session = await authClient.getSession({
		fetchOptions: {
			headers: await headers(),
			throw: true,
		},
	});

	console.log("session", session);

	if (!session?.user) {
		redirect("/login");
	}

	return <HomeContent user={session.user} />;
}
