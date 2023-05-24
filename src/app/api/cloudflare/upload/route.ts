import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/../prisma/prismadb';
import { auth } from '@clerk/nextjs';

const parseMetadata = (metadata: string): Record<string, string> => {
  const keyValuePairs = metadata.split(',').map((pair) => pair.split(' '));
  const parsedMetadata: Record<string, string> = {};
  keyValuePairs.forEach(([key, value]) => {
    parsedMetadata[key] = Buffer.from(value, 'base64').toString();
  });
  return parsedMetadata;
};

export async function POST(request: NextRequest): Promise<NextResponse> {
  // Check Cloudflare credentials
  const { CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_API_TOKEN } = process.env;
  if (!CLOUDFLARE_ACCOUNT_ID || !CLOUDFLARE_API_TOKEN) {
    console.log('Missing Cloudflare credentials');
    return new NextResponse("Missing Cloudflare credentials", { status: 500 })
  }

//   // Check user is authenticated
//   const {userId} = auth();
//   if(!userId){
//     return new NextResponse("Unauthorized", { status: 401 });
//   }

  // Get course ID from metadata
  const metadata = request.headers.get('upload-metadata') || '';
  const parsedMetadata = parseMetadata(metadata);

  // Access the custom data using the course_id key
  const course_id = parsedMetadata['course_id'];
  const lesson_id = parsedMetadata['lesson_id'];

  // Create a new lesson and connect it to the course
  const lesson = await prisma.lesson.create({
    data: {
      id: lesson_id,
      course: {
        connect: {
          id: course_id
        },
      }
    }
  });

  const endpoint = `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/stream?direct_user=true`;

  const uploadLength = request.headers.get('upload-length') || '';
  const lessonIdMetadata = `lesson_id ${Buffer.from(lesson.id.toString()).toString('base64')}`;
  const uploadMetadata = (request.headers.get('upload-metadata') || '') + ',' + lessonIdMetadata;

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Authorization': `bearer ${CLOUDFLARE_API_TOKEN}`,
      'Tus-Resumable': '1.0.0',
      'Upload-Length': uploadLength,
      'Upload-Metadata': uploadMetadata,
    },
  });

  const destination = response.headers.get('Location') || '';

  const res = new NextResponse("Cloudflare upload route", { status: 200 } );
  res.headers.set('Access-Control-Expose-Headers', 'Location');
  res.headers.set('Access-Control-Allow-Headers', '*');
  res.headers.set('Access-Control-Allow-Origin', '*');
  res.headers.set('Location', destination);
  return res;
}