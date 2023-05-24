import { currentUser } from "@clerk/nextjs/server";
import prisma from "@/../prisma/prismadb";

export async function PUT (request: Request) {
    // Get the authenticated user
    const authenticatedUser = await currentUser();
    if (!authenticatedUser) {
        return new Response(null, { status: 401 });
    }
    const user = await prisma.user.findUnique({
        where: {
            clerk_id: authenticatedUser.id,
        },
    });
    if (!user) {
        return new Response(null, { status: 404 });
    }

    // Get the lesson ID and video URL from the request body
    const { id, video_upload_url, video_id } = await request.json();

    // Get the request lesson from the database
    const currentLesson = await prisma.lesson.findUnique({
        where: {
            id,
        },
        include: {
            course: true,
        }
    });
    if (!currentLesson) {
        return new Response(null, { status: 404 });
    }

    // Check the user is the creator of the course
    if (currentLesson.course.created_by_id !== user.id) {
        return new Response(null, { status: 403 });
    }

    // Update the lesson
    const updatedLesson = await prisma.lesson.update({
        where: {
            id,
        },
        data: {
            video_upload_url,
            video_id
        },
    });

    return new Response(JSON.stringify(updatedLesson), { status: 200 });
}