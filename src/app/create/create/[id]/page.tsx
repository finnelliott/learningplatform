import prisma from "@/../prisma/prismadb";
import Upload from "@/components/Upload";
import { currentUser } from "@clerk/nextjs";

export default async function Page({
    params,
  }: {
    params: { id: string };
  }) {
    const authenticatedUser = await currentUser();
    if (!authenticatedUser) return <div>Not authenticated</div>
    const user = await prisma.user.findUnique({
        where: {
            clerk_id: authenticatedUser.id
        }
    });
    if (!user) return <div>No user found</div>

    let course_id = params.id;

    return (
        <div className="">
            <h1>Create a new course</h1>
            <p>Just upload the video content of your course to get started.</p>
            <label htmlFor="content">Upload content
                <input id="content" type="file" multiple={true} />
            </label>
            <Upload course_id={course_id} />
        </div>
    )
}