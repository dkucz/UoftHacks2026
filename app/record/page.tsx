"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "../../shared/ui/button";
import { Card } from "../../shared/ui/card";
import { Mic, Square, ArrowLeft, CheckCircle, Heart, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export default function RecordStoryPage() {
  const router = useRouter();
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [hasRecorded, setHasRecorded] = useState(false);

  useEffect(() => {
    let interval: number;
    if (isRecording) {
      interval = window.setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStartRecording = () => {
    setIsRecording(true);
    setRecordingTime(0);
    setHasRecorded(false);
  };

  const handleStopRecording = () => {
    setIsRecording(false);
    setHasRecorded(true);
  };

  const handleSubmit = () => {
    // Mock transcript - in production, this would come from speech-to-text API
    const mockTranscript = `I remember when I was just a little girl, growing up in the old neighborhood. Your great-grandfather used to walk me to school every single morning, rain or shine. He'd hold my hand and tell me stories about when he first came to this country with nothing but a suitcase and a dream.

Those were different times, you know. We didn't have much, but we had each other. Sunday dinners were sacred in our family - everyone would gather around the table, and we'd share stories, laughter, and your great-grandmother's famous apple pie. She never wrote down the recipe, said it was all in the feel of the dough.

I'm telling you these stories because they're important. They're part of who we are, where we came from. And I want you to remember them, to pass them on to your children someday.`;

    const mockTitle = `Family Memory - ${new Date().toLocaleDateString()}`;
    
    const newStory = {
      id: Date.now().toString(),
      title: mockTitle,
      excerpt: `${mockTranscript.split("\n")[0]}...`,
      date: new Date().toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      }),
      language: "English",
      duration: formatTime(recordingTime),
    };

    const storedStories = window.localStorage.getItem("family-stories");
    try {
      const existingStories = storedStories ? JSON.parse(storedStories) : [];
      if (Array.isArray(existingStories)) {
        window.localStorage.setItem(
          "family-stories",
          JSON.stringify([newStory, ...existingStories])
        );
      }
    } catch {
      window.localStorage.setItem("family-stories", JSON.stringify([newStory]));
    }

    const params = new URLSearchParams({
      transcript: mockTranscript,
      title: mockTitle,
    });
    router.push(`/transcript?${params.toString()}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 p-6">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-4"
        >
          <Button
            onClick={() => router.push("/home")}
            variant="ghost"
            size="icon"
            className="hover:bg-amber-100"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-amber-900">Record a Family Story</h1>
            <p className="text-amber-700">Share memories that will last forever</p>
          </div>
        </motion.div>

        {/* Recording Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="p-10 bg-white/90 backdrop-blur-sm shadow-xl border-2 border-amber-100">
            <div className="space-y-8">
              {/* Instructions */}
              <div className="text-center space-y-3">
                <AnimatePresence mode="wait">
                  {!hasRecorded && !isRecording && (
                    <motion.div
                      key="ready"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                    >
                      <Heart className="w-12 h-12 mx-auto text-rose-500 mb-3" />
                      <p className="text-xl text-amber-900 font-medium">
                        Ready to capture a precious memory?
                      </p>
                      <p className="text-amber-700">
                        Press the microphone button to begin recording
                      </p>
                    </motion.div>
                  )}
                  {isRecording && (
                    <motion.div
                      key="recording"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                    >
                      <Sparkles className="w-12 h-12 mx-auto text-amber-500 mb-3" />
                      <p className="text-xl text-amber-900 font-medium">
                        Recording your story...
                      </p>
                      <p className="text-amber-700">
                        Take your time and share your memories naturally
                      </p>
                    </motion.div>
                  )}
                  {hasRecorded && !isRecording && (
                    <motion.div
                      key="complete"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                    >
                      <p className="text-xl text-amber-900 font-medium">
                        Recording complete! 
                      </p>
                      <p className="text-amber-700">
                        Review and save your precious family story
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Recording Indicator */}
              <AnimatePresence>
                {isRecording && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="flex items-center justify-center gap-4 bg-gradient-to-r from-red-50 to-rose-50 rounded-2xl p-6"
                  >
                    <div className="relative">
                      <motion.div 
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ repeat: Infinity, duration: 1.5 }}
                        className="w-6 h-6 bg-red-500 rounded-full"
                      ></motion.div>
                      <motion.div 
                        animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                        transition={{ repeat: Infinity, duration: 1.5 }}
                        className="absolute inset-0 w-6 h-6 bg-red-500 rounded-full"
                      ></motion.div>
                    </div>
                    <span className="text-4xl font-mono text-amber-900 font-semibold">
                      {formatTime(recordingTime)}
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Microphone Button */}
              <div className="flex justify-center">
                <AnimatePresence mode="wait">
                  {!isRecording && !hasRecorded && (
                    <motion.div
                      key="start"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Button
                        onClick={handleStartRecording}
                        size="lg"
                        className="w-40 h-40 rounded-full bg-gradient-to-br from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 shadow-2xl"
                      >
                        <Mic className="w-16 h-16" />
                      </Button>
                    </motion.div>
                  )}

                  {isRecording && (
                    <motion.div
                      key="stop"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Button
                        onClick={handleStopRecording}
                        size="lg"
                        className="w-40 h-40 rounded-full bg-gradient-to-br from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 shadow-2xl"
                      >
                        <Square className="w-16 h-16" />
                      </Button>
                    </motion.div>
                  )}

                  {hasRecorded && !isRecording && (
                    <motion.div
                      key="complete"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="text-center space-y-4"
                    >
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 200, damping: 15 }}
                      >
                        <CheckCircle className="w-24 h-24 mx-auto text-green-600" />
                      </motion.div>
                      <p className="text-amber-900 font-medium text-lg">
                        Recording saved ({formatTime(recordingTime)})
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Action Buttons */}
              <AnimatePresence>
                {hasRecorded && !isRecording && (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="flex gap-4"
                  >
                    <Button
                      onClick={handleStartRecording}
                      variant="outline"
                      className="flex-1 border-2 border-amber-600 text-amber-900 hover:bg-amber-50"
                    >
                      Record Again
                    </Button>
                    <Button
                      onClick={handleSubmit}
                      className="flex-1 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 shadow-lg"
                    >
                      View Transcript
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </Card>
        </motion.div>

        {/* Tips */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="p-6 bg-white/70 backdrop-blur-sm border border-amber-200">
            <div className="flex items-start gap-3">
              <Sparkles className="w-6 h-6 text-amber-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-amber-900 mb-3">Recording Tips:</h3>
                <ul className="space-y-2 text-sm text-amber-800">
                  <li className="flex items-start gap-2">
                    <span className="text-amber-600 font-semibold">•</span>
                    <span>Find a quiet, comfortable space to minimize background noise</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-amber-600 font-semibold">•</span>
                    <span>Speak naturally, as if talking to a loved one</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-amber-600 font-semibold">•</span>
                    <span>Share specific details - dates, places, names, and emotions</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-amber-600 font-semibold">•</span>
                    <span>Don't worry about perfection - authenticity matters most</span>
                  </li>
                </ul>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}