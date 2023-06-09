import { NextRequest } from "next/server";
import prisma from "@/../prisma/prismadb";
import { getAuth } from "@clerk/nextjs/server";
import fs from 'fs';
import axios from "axios";
import FormData from "form-data";

async function fetchGenerateCourse(course_id: string, token: string) {
  const url = `${process.env.NODE_ENV === "production" && process.env.VERCEL === "1" ? 'https://' : 'http://'}create.${process.env.DOMAIN}/api/generate/course`
  fetch(url, {
    method: 'POST',
    headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      course_id: course_id
  })
  });
  return;
}

async function downloadFile(url: string, filePath: string) {
  const response = await axios({
    method: 'get',
    url: url,
    responseType: 'stream',
  });

  const writer = fs.createWriteStream(filePath);
  response.data.pipe(writer);

  return new Promise((resolve, reject) => {
    writer.on('finish', resolve);
    writer.on('error', reject);
  });
}

export async function POST(request: NextRequest) {
  console.log("Requested lesson transcription")
  const { CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_API_TOKEN } = process.env;
  if (!CLOUDFLARE_ACCOUNT_ID || !CLOUDFLARE_API_TOKEN) {
    return new Response("Missing Cloudflare credentials", { status: 500 });
  }

  const { lesson_id } = await request.json();
  const { getToken } = getAuth(request);
  const token = await getToken();
  if (!token) {
    return new Response("Unauthorized", { status: 401 });
  }

  // Get the lesson
  const lesson = await prisma.lesson.findUnique({
    where: {
      id: lesson_id,
    },
  });

  if (!lesson) {
    return new Response("Lesson not found", { status: 404 });
  }

  // If download URL is not set, enable downloads and get the URL
  if (!lesson.video_download_url) {
    const response = await fetch(`https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/stream/${lesson.video_id}/downloads`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${CLOUDFLARE_API_TOKEN}`,
        "Content-Type": "application/json",
      },
    }).then((res) => res.json());
    const video_download_url = response.result.default.url;
    await prisma.lesson.update({
      where: {
        id: lesson_id,
      },
      data: {
        video_download_url,
      },
    });

    fetchGenerateCourse(lesson.course_id, token);

    return new Response("Enabled downloads for lesson.")
  }

  const url = lesson.video_download_url;
  const filePath = process.cwd() + "/tmp/" + lesson.video_id + ".mp4";
  const response = await axios({
    method: 'get',
    url: url,
    responseType: 'stream',
  });

  const writer = fs.createWriteStream(filePath);
  await new Promise((resolve, reject) => {
    response.data.pipe(writer);
    writer.on('finish', resolve);
    writer.on('error', reject);
  });

  const fileStream = fs.createReadStream(filePath);
  const data = new FormData();
  data.append("model", "whisper-1");
  data.append("file", fileStream);

  const resp = await axios({
    method: "POST",
    url: "https://api.openai.com/v1/audio/transcriptions",
    headers: {
      "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
      ...data.getHeaders(),
    },
    data: data,
  });

  console.log(resp.data);

  if (!resp.data) {
    return new Response("Failed to generate transcription", { status: 500 });
  }
  const transcription = resp.data.text;
  await prisma.lesson.update({
    where: {
      id: lesson_id,
    },
    data: {
      transcription,
    },
  });

  fetchGenerateCourse(lesson.course_id, token);

  return new Response("Generated transcription successfully.", { status: 200 })
}