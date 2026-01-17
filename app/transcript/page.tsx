import { Suspense } from "react";
import TranscriptClient from "./TranscriptClient";

export default function TranscriptPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 p-6">
          <div className="max-w-4xl mx-auto text-amber-800">
            Loading transcript...
          </div>
        </div>
      }
    >
      <TranscriptClient />
    </Suspense>
  );
}