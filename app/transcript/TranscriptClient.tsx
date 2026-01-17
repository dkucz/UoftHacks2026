"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "../../shared/ui/button";
import { Card } from "../../shared/ui/card";
import { Input } from "../../shared/ui/input";
import { ArrowLeft, MessageSquare, FileText, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

type RecordingResponse = {
  ok: true;
  recording: {
    _id: string;
    title?: string;
    status?: string;
    createdAt?: string;
  };
};

type TranscriptResponse = {
  ok: true;
  transcript: string;
  status?: string;
};

export default function TranscriptClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = useMemo(() => searchParams.get("id") ?? "", [searchParams]);

  const [title, setTitle] = useState("Untitled Family Story");
  const [titleDraft, setTitleDraft] = useState("");
  const [savingTitle, setSavingTitle] = useState(false);
  const [titleSaveMessage, setTitleSaveMessage] = useState<string | null>(null);
  const [titleSaveError, setTitleSaveError] = useState<string | null>(null);
  const [transcript, setTranscript] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setError("Missing recording id.");
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        // 1) get recording metadata (title/status)
        const recRes = await fetch(`/api/recordings/${id}`);
        if (!recRes.ok) throw new Error(await recRes.text());
        const recJson = (await recRes.json()) as RecordingResponse;
        const recTitle = recJson.recording.title || "";
        const createdAt = recJson.recording.createdAt
          ? new Date(recJson.recording.createdAt)
          : new Date();
        const formattedDate = createdAt.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        });
        const fallbackTitle = `Story 1 - ${formattedDate}`;
        const nextTitle = recTitle || fallbackTitle;
        if (!cancelled) {
          setTitle(nextTitle);
          setTitleDraft(nextTitle);
        }

        // 2) get transcript text
        const tRes = await fetch(`/api/recordings/${id}/transcript`);
        if (!tRes.ok) throw new Error(await tRes.text());
        const tJson = (await tRes.json()) as TranscriptResponse;

        if (!cancelled) setTranscript(tJson.transcript || "");
      } catch (e: any) {
        if (!cancelled) setError(e?.message || "Failed to load transcript.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [id]);

  const handleStartChat = () => {
    if (!id) return;
    router.push(`/chat?id=${encodeURIComponent(id)}`);
  };

  const handleSaveTitle = async () => {
    if (!id) return;
    const trimmed = titleDraft.trim();
    if (!trimmed || trimmed === title || savingTitle) return;

    setSavingTitle(true);
    setError(null);
    setTitleSaveMessage(null);
    setTitleSaveError(null);
    try {
      const res = await fetch(`/api/recordings/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: trimmed }),
      });
      if (!res.ok) {
        throw new Error("Failed to update title.");
      }
      setTitle(trimmed);
      setTitleDraft(trimmed);
      setTitleSaveMessage("Title saved.");
    } catch (e: any) {
      const message = e?.message || "Failed to update title.";
      setTitleSaveError(message);
      setError(message);
    } finally {
      setSavingTitle(false);
    }
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
              onClick={() => router.push("/")}
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
        </motion.div>

        {loading && (
          <Card className="p-6 bg-white/90 border-2 border-amber-100">
            <p className="text-amber-800">Loading transcript…</p>
          </Card>
        )}

        {error && (
          <Card className="p-6 bg-white/90 border-2 border-red-200">
            <p className="text-red-700">{error}</p>
          </Card>
        )}

        {!loading && !error && (
          <>
            {/* Title */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <Card className="p-6 bg-white/90 backdrop-blur-sm shadow-lg border-2 border-amber-100">
                <div className="flex items-center gap-3 mb-3">
                  <FileText className="w-6 h-6 text-amber-600" />
                  <span className="text-sm font-medium text-amber-700">Story Title</span>
                </div>
                <div className="flex flex-col gap-3">
                  <Input
                    value={titleDraft}
                    onChange={(e) => setTitleDraft(e.target.value)}
                    className="text-xl font-semibold border-2 border-amber-200 focus:border-amber-400"
                    placeholder="Story title"
                    disabled={loading || savingTitle}
                  />
                  <div className="flex gap-2 items-center">
                    <Button
                      onClick={handleSaveTitle}
                      disabled={
                        loading ||
                        savingTitle ||
                        !titleDraft.trim() ||
                        titleDraft.trim() === title
                      }
                      className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                    >
                      {savingTitle ? "Saving..." : "Save Title"}
                    </Button>
                    {titleSaveMessage && (
                      <span className="text-sm text-green-700">{titleSaveMessage}</span>
                    )}
                    {titleSaveError && (
                      <span className="text-sm text-rose-700">{titleSaveError}</span>
                    )}
                  </div>
                </div>
              </Card>
            </motion.div>

            {/* Transcript */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <Card className="p-8 bg-white/90 backdrop-blur-sm shadow-lg border-2 border-amber-100">
                <div className="flex items-center gap-3 mb-6">
                  <Sparkles className="w-6 h-6 text-amber-600" />
                  <h3 className="text-xl font-semibold text-amber-900">Transcript</h3>
                </div>

                <div className="prose prose-lg max-w-none">
                  <p className="text-amber-900 whitespace-pre-wrap leading-relaxed font-serif text-lg">
                    {transcript || "(No transcript yet.)"}
                  </p>
                </div>
              </Card>
            </motion.div>

            {/* Actions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
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
          </>
        )}
      </div>
    </div>
  );
}