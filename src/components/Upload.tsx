"use client";
import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Uppy from '@uppy/core';
import Tus from '@uppy/tus';
import { DragDrop, ProgressBar } from '@uppy/react';
const { ObjectId } = require('bson');

function generateObjectId() {
  const objectId = new ObjectId();
  return objectId.toHexString();
}

const Upload = ({ course_id }: { course_id: string }) => {
  const [uppyInstance, setUppyInstance] = useState<Uppy>();
  const lessonId = generateObjectId();

  useEffect(() => {
    const uppy = new Uppy({ debug: true, autoProceed: true });

    uppy
      .on('file-added', (file) => {
        // Set the video ID in the file.meta object
        
        uppy.setFileState(file.id, {
          meta: { ...file.meta, lesson_id: lessonId },
        });
      })
      .use(Tus, {
        endpoint: '/api/cloudflare/upload',
        chunkSize: 150 * 1024 * 1024,
        headers: {
            'Upload-Metadata': 'course_id ' + Buffer.from(course_id).toString('base64') + ',lesson_id ' + Buffer.from(lessonId).toString('base64'),
        },
      })
      .on('upload-success', async (file: any, response) => {
        const li = document.createElement('li');
        const a = document.createElement('a');
        a.href = response.uploadURL as string;
        a.target = '_blank';
        a.appendChild(document.createTextNode(file.name));
        li.appendChild(a);

        document.querySelector('.uploaded-files ol')?.appendChild(li);

        const lessonId = file.meta.lesson_id;

        // Send a request to the lesson API route to update the record with the video URL
        if (lessonId) {
          try {
            await fetch('/api/lesson', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    id: lessonId,
                    video_upload_url: response.uploadURL,
                    video_id: response.uploadURL?.replace("https://upload.videodelivery.net/tus/", "").split("?")[0],
                }),
            });
          } catch (error) {
            console.error('Error updating video:', error);
          }
        }
      });

    setUppyInstance(uppy);

    return () => {
      uppy.close();
    };
  }, []);

  return (
    <>
      <Head>
        <link href="https://releases.transloadit.com/uppy/v3.0.1/uppy.min.css" rel="stylesheet" />
      </Head>
      {uppyInstance && (
        <>
          <DragDrop uppy={uppyInstance} />
          <ProgressBar uppy={uppyInstance} />
        </>
      )}
      <button
        className="upload-button"
        style={{ fontSize: '30px', margin: '20px' }}
        onClick={() => uppyInstance && uppyInstance.upload()}
      >
        Upload
      </button>
      <div className="uploaded-files" style={{ marginTop: '50px' }}>
        <ol></ol>
      </div>
    </>
  );
};

export default Upload;