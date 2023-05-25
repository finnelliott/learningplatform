import { NextRequest } from "next/server";
import prisma from "@/../prisma/prismadb";
import { getAuth } from "@clerk/nextjs/server";
import refetchCourseGeneration from "@/utils/refetchCourseGeneration";

export async function POST(request: NextRequest) {
  const { getToken } = getAuth(request);
  const token = await getToken();
  if (!token) {
    return new Response("Unauthorized", { status: 401 });
  }
  const { course_id, lessons } = await request.json();

  if (!lessons) return new Response("No lessons provided.", { status: 500 });

  const response = await fetch(`https://api.openai.com/v1/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: "gpt-4",
      "messages": [
        {"role": "system", "content": `You are going to be provided with an array of lessons with their associated IDs and summaries. Return an array of the lessons with their associated IDs and suitable name for each of them with the key "name". Only return a JSON string. Do not provide any explanation or notes.`},
        {"role": "user", "content": JSON.stringify(lessons) }
      ]
    })
  }).then(res => res.json());

  const generatedContent = JSON.parse(response.choices[0].message.content);

  console.log("Generated content: ", generatedContent);

  for (let i = 0; i < generatedContent.length; i++) {
    await prisma.lesson.updateMany({
        where: {
          id: generatedContent[i].id
        },
        data: {
          name: generatedContent[i].name
        }
    });
  };

  refetchCourseGeneration(course_id, token)

  return new Response("Names generated successfully", { status: 200 });
}