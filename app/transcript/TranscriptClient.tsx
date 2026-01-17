"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "../../shared/ui/button";
import { Card } from "../../shared/ui/card";
import { Input } from "../../shared/ui/input";
import { ArrowLeft, MessageSquare, FileText, Sparkles } from "lucide-react";
import { motion } from "motion/react";

export default function TranscriptClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const transcript = useMemo(
    () => searchParams.get("transcript") ?? "",
    [searchParams]
  );
  const title = useMemo(
    () => searchParams.get("title") ?? "Untitled Family Story",
    [searchParams]
  );
  const [editedTranscript] = useState(transcript);
  const [editedTitle] = useState(title);

  const handleStartChat = () => {
    const params = new URLSearchParams({
      transcript: editedTranscript,
      title: editedTitle,
    });
    router.push(`/chat?${params.toString()}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center justify-between"
        >
          <div className="flex items-center gap-4">
            <Button
              onClick={() => router.push("/home")}
              variant="ghost"
              size="icon"
              className="hover:bg-amber-100"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-amber-900">Story Transcript</h1>
              <p className="text-amber-700">Review and refine your family memory</p>
            </div>
          </div>
          <div className="flex gap-2"></div>
        </motion.div>

        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="p-6 bg-white/90 backdrop-blur-sm shadow-lg border-2 border-amber-100">
            <div className="flex items-center gap-3 mb-3">
              <FileText className="w-6 h-6 text-amber-600" />
              <span className="text-sm font-medium text-amber-700">Story Title</span>
            </div>
            <h2 className="text-2xl font-bold text-amber-900">{editedTitle}</h2>
          </Card>
        </motion.div>

        {/* Transcript */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="p-8 bg-white/90 backdrop-blur-sm shadow-lg border-2 border-amber-100">
            <div className="flex items-center gap-3 mb-6">
              <Sparkles className="w-6 h-6 text-amber-600" />
              <h3 className="text-xl font-semibold text-amber-900">Transcript</h3>
            </div>
            <div className="prose prose-lg max-w-none">
              <p className="text-amber-900 whitespace-pre-wrap leading-relaxed font-serif text-lg">
                {editedTranscript}
              </p>
            </div>
          </Card>
        </motion.div>

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex gap-4"
        >
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="flex-1">
            <Button
              onClick={handleStartChat}
              className="w-full py-6 text-lg bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 gap-2 shadow-lg"
              size="lg"
            >
              <MessageSquare className="w-5 h-5" />
              Ask Questions About This Story
              <Sparkles className="w-4 h-4" />
            </Button>
          </motion.div>
        </motion.div>

        {/* Info Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="p-6 bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200">
            <div className="flex items-start gap-3">
              <MessageSquare className="w-6 h-6 text-amber-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-amber-900 mb-2">What's next?</h3>
                <p className="text-sm text-amber-800 leading-relaxed">
                  You can ask AI questions about this story to explore details, understand
                  context, or find specific information. Perfect for deepening your
                  connection with your family's history.
                </p>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
