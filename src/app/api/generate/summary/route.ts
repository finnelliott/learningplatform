import { NextRequest } from "next/server";
import prisma from "@/../prisma/prismadb";

export async function POST(request: NextRequest) {
  const { lesson_id } = await request.json();
  
  const lesson = await prisma.lesson.findUnique({
    where: {
      id: lesson_id
    }
  })

  if (!lesson) return new Response("Unable to find lesson with the provided ID.", { status: 500 });

  if (!lesson.transcription) return new Response("You must generate the transcription for this lesson before you may create a summary.", { status: 500 });

  const response = await fetch(`https://api.openai.com/v1/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: "gpt-3.5-turbo",
      "messages": [
        {"role": "system", "content": `You are going to be provided with a transcript for a lesson in a video course. Please summarise the transcript into 200 words or less. Provide the summary as a description of the lesson's content.`},
        {"role": "user", "content": lesson.transcription }
      ]
    })
  }).then(res => res.json());

  await prisma.lesson.update({
    where: {
      id: lesson.id
    },
    data: {
      summary: response.choices[0].message.content
    }
  })

  return new Response("Summary generated successfully", { status: 200 })
}