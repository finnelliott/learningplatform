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
            <Link href="/"> &larr; Back to dashboard</Link>
            <h1>Your courses</h1>
            <form action={createCourse}>
                <button type="submit">Create a course</button>
            </form>
            <h2>Courses</h2>
            {courses.length > 0 ? courses.map((course) => (
                <Link key={course.id} href={`/courses/${course.id}`}>
                    <h3>{course.id}</h3>
                </Link>
            )) : <p>You have no courses</p>}
        </div>
    )
}