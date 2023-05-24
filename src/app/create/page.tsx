import prisma from "@/../prisma/prismadb";
import { currentUser } from "@clerk/nextjs";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function Page() {
    const authenticatedUser = await currentUser();
    if (!authenticatedUser) return <div>Not authenticated</div>
    
    const courses = await prisma?.course.findMany({
        where: {
            created_by: {
                clerk_id: authenticatedUser.id
            }
        }
    })

    async function createCourse() {
        "use server";
        const authenticatedUser = await currentUser();
        if (!authenticatedUser) return <div>Not authenticated</div>

        const course = await prisma.course.create({
            data: {
                created_by: {
                    connect: {
                        clerk_id: authenticatedUser.id
                    }
                }
            }
        })

        return redirect(`/courses/${course.id}`)
    }

    return (
        <div className="">
            <h1>Creator dashboard</h1>
            <Link href="/courses">Your courses</Link>
        </div>
    )
}