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
        {"role": "system", "content": `You are going to be provided with an array of lesson names from a course. Return a suitable name and description for the course that these lessons form, in a JSON string with keys "name" and "description". Do not provide any explanation or notes.`},
        {"role": "user", "content": JSON.stringify(lessons) }
      ]
    })
  }).then(res => res.json());

  const { name, description } = JSON.parse(response.choices[0].message.content);

  console.log("Generated course name: ", name);
  console.log("Generated course description: ", description)

  await prisma.course.update({
    where: {
      id: course_id
    },
    data: {
      name,
      description
    }
  });

  refetchCourseGeneration(course_id, token)

  return new Response("Course name generated successfully", { status: 200 });
}