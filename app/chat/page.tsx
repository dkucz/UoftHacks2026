import { Suspense } from "react";
import ChatClient from "./ChatClient";

export default function ChatPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 p-6">
          <div className="max-w-4xl mx-auto text-amber-800">
            Loading chat...
          </div>
        </div>
      }
    >
      <ChatClient />
    </Suspense>
  );
}