import prisma from "@/../prisma/prismadb";
import { currentUser } from "@clerk/nextjs";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function Page() {
    const authenticatedUser = await currentUser();
    if (!authenticatedUser) return <div>Not authenticated</div>

    return (
        <div className="">
            <h1>Creator dashboard</h1>
            <Link href="/courses">Your courses</Link>
        </div>
    )
}