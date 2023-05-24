import prisma from "@/../prisma/prismadb";
import Upload from "@/components/Upload";
import { currentUser } from "@clerk/nextjs";
import Link from "next/link";

export default async function Page({
    params,
  }: {
    params: { id: string };
  }) {
    let course_id = params.id;
    const authenticatedUser = await currentUser();
    if (!authenticatedUser) return <div>Not authenticated</div>
    const user = await prisma.user.findUnique({
        where: {
            clerk_id: authenticatedUser.id
        }
    });
    if (!user) return <div>No user found</div>
    const course = await prisma.course.findUnique({
        where: {
            id: course_id
        },
        include: {
            lessons: true
        }
    });
    function generateCourse() {
        return;
    }

    return (
        <div className="">
            <Link href="/courses"> &larr; Back to courses</Link>
            <button className="">Delete</button>
            <button className="">Save</button>
            <h1>Create a new course</h1>
            <p>Just upload the video content of your course to get started.</p>
            <label htmlFor="content">Upload content
                <input id="content" type="file" multiple={true} />
            </label>
            <Upload course_id={course_id} />
            <h2>Lessons</h2>
            {course?.lessons && course?.lessons.length > 0 ? 
            <ul>
                {course?.lessons.map((lesson) => (
                    <li key={lesson.id}>
                        <a href={`/courses/${course_id}/lessons/${lesson.id}`}>{lesson.id}</a>
                    </li>
                ))}
            </ul>
            : <p>No lessons yet</p>}
            {course?.lessons && course?.lessons.length > 0 && <button onClick={() => generateCourse()}>Generate course</button>}
        </div>
    )
}