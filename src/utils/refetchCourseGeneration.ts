export default async function refetchCourseGeneration(course_id: string, token: string) {
    const url = `${process.env.VERCEL === "1" ? 'https://' : 'http://'}create.${process.env.DOMAIN}/api/generate/course`
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