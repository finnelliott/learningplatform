import prisma from "@/../prisma/prismadb";
import GenerateCourseButton from "@/components/GenerateCourseButton";
import Upload from "@/components/Upload";
import { currentUser } from "@clerk/nextjs";
import Link from "next/link";

export default async function Page({
    params,
  }: {
    params: { course_id: string, lesson_id: string };
  }) {
    let { lesson_id, course_id } = params;
    const authenticatedUser = await currentUser();
    if (!authenticatedUser) return <div>Not authenticated</div>
    const user = await prisma.user.findUnique({
        where: {
            clerk_id: authenticatedUser.id
        }
    });
    if (!user) return <div>No user found</div>
    const lesson = await prisma.lesson.findUnique({
        where: {
            id: lesson_id
        },
        include: {
            course: {
                select: {
                    created_by_id: true
                }
            }
        }
    });
    if (user.id !== lesson?.course.created_by_id) return <div>Only the creator of this course can access this page.</div>

    return (
        <div className="">
            <Link href={`/courses/${course_id}`}> &larr; Back to course</Link>
            {JSON.stringify(lesson)}
        </div>
    )
}