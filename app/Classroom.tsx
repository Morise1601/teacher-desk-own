'use client';
import { useParams } from 'next/navigation';

export default function ClassroomPage() {
  const { id } = useParams();

  return (
    <div className="w-full h-screen flex flex-col items-center justify-center bg-gray-100">
      <h2 className="text-xl font-bold mb-4">Google Meet Classroom</h2>
      <iframe
        src={`https://meet.google.com/${id}`}
        className="w-[90%] h-[80%] rounded-lg shadow-lg border"
        allow="camera; microphone; fullscreen"
      ></iframe>
    </div>
  );
}
