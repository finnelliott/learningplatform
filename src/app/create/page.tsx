import prisma from "@/../prisma/prismadb";
import { currentUser } from "@clerk/nextjs";
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

        return redirect(`/create/${course.id}`)
    }

    return (
        <div className="">
            <h1>Creator dashboard</h1>
            <form action={createCourse}>
                <button type="submit">Create a course</button>
            </form>
            <h2>Courses</h2>
            {courses.length > 0 ? courses.map((course) => (
                <div key={course.id}>
                    <h3>{course.name}</h3>
                    <p>{course.description}</p>
                </div>
            )) : <p>You have no courses</p>}
        </div>
    )
}