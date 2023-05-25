"use client";

export default function GenerateCourseButton({ course_id }: { course_id: string }) {
    async function generateCourse() {
        const url = `${process.env.VERCEL === "1" ? 'https://' : 'http://'}create.${process.env.NEXT_PUBLIC_DOMAIN}/api/generate/course`
        console.log(url)
        const response = await fetch(url, {
            method: "POST",
            body: JSON.stringify({
                course_id: course_id
            })
        }).then((res) => res.text());
        console.log(response);
    }

    return (
        <button onClick={() => generateCourse()}>Generate course</button>
    )
}