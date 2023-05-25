import { NextRequest } from "next/server";
import prisma from '@/../prisma/prismadb';
import { getAuth } from "@clerk/nextjs/server";

export async function POST(request: NextRequest) {
    console.log("Requested course generation");
    const { course_id } = await request.json();
    const { getToken } = getAuth(request);

    // Mark status of course as "generating" and return the lessons
    const course = await prisma.course.update({
        where: {
            id: course_id
        },
        data: {
            status: "generating"
        },
        include: {
            lessons: true
        }
    });

    // Get the lessons which do not have a transcription
    const lessonsWithoutTranscription = course.lessons.filter(lesson => !lesson.transcription);

    // Get the transcript for the next lesson which does not have one
    if (lessonsWithoutTranscription.length > 0) {
        const url = `${process.env.VERCEL === "1" ? 'https://' : 'http://'}create.${process.env.DOMAIN}/api/generate/transcription`
        console.log(url)
        fetch(url, {
            method: 'POST',
            headers: { 
                'Authorization': `Bearer ${await getToken()}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                lesson_id: lessonsWithoutTranscription[0].id
            })
        });
        return new Response(`Transcribing lesson ${course.lessons.length - lessonsWithoutTranscription.length + 1} of ${course.lessons.length}`)
    }

    // Get the lessons which do not have a summary
    const lessonsWithoutSummary = course.lessons.filter(lesson => !lesson.summary);

    // Get the summary for the next lesson which does not have one
    if (lessonsWithoutSummary.length > 0) {
        const url = `${process.env.VERCEL === "1" ? 'https://' : 'http://'}create.${process.env.DOMAIN}/api/generate/summary`
        fetch(url, {
            method: 'POST',
            headers: { 
                'Authorization': `Bearer ${await getToken()}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                lesson_id: lessonsWithoutSummary[0].id
            })
        });
        return new Response(`Summarising lesson ${course.lessons.length - lessonsWithoutTranscription.length + 1} of ${course.lessons.length}.`)
    }

    // Get the lessons which do not have a summary
    const lessonsWithoutName = course.lessons.filter(lesson => !lesson.name);

    // Generate names for all of the lessons without one
    if (lessonsWithoutName.length > 0) {
        console.log("Generating names")
        const url = `${process.env.VERCEL === "1" ? 'https://' : 'http://'}create.${process.env.DOMAIN}/api/generate/names`
        fetch(url, {
            method: 'POST',
            headers: { 
                'Authorization': `Bearer ${await getToken()}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                course_id,
                lessons: lessonsWithoutName.map((lesson) => ({ id: lesson.id, summary: lesson.summary }))
            })
        });
        return new Response(`Naming ${lessonsWithoutName.length} lessons.`)
    }

    // Based on the lesson names, generate a course name and description
    if (!course.name) {
        const url = `${process.env.VERCEL === "1" ? 'https://' : 'http://'}create.${process.env.DOMAIN}/api/generate/course-name-and-description`
        fetch(url, {
            method: 'POST',
            headers: { 
                'Authorization': `Bearer ${await getToken()}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                course_id: course.id,
                lessons: course.lessons.map((lesson) => lesson.name)
            })
        });
        return new Response(`Naming course.`)
    }

    console.log("Generation complete")
    return new Response("Generation complete", { status: 200 })
}