"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "../../shared/ui/button";
import { Card } from "../../shared/ui/card";
import { Mic, Square, ArrowLeft, CheckCircle, Heart, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function RecordStoryPage() {
  const router = useRouter();

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const recordedBlobRef = useRef<Blob | null>(null);

  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [hasRecorded, setHasRecorded] = useState(false);

  const [busy, setBusy] = useState(false); // transcribing
  const [error, setError] = useState<string | null>(null);

  // Audio capture refs
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const buffersRef = useRef<Float32Array[]>([]);
  const inputSampleRateRef = useRef<number>(48000);

  useEffect(() => {
    let interval: number | undefined;
    if (isRecording) {
      interval = window.setInterval(() => setRecordingTime((prev) => prev + 1), 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRecording]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const cleanupAudio = async () => {
    try {
      processorRef.current?.disconnect();
    } catch {}
    try {
      sourceRef.current?.disconnect();
    } catch {}

    processorRef.current = null;
    sourceRef.current = null;

    try {
      await audioCtxRef.current?.close();
    } catch {}
    audioCtxRef.current = null;

    try {
      mediaStreamRef.current?.getTracks().forEach((t) => t.stop());
    } catch {}
    mediaStreamRef.current = null;
  };

  const handleStartRecording = async () => {
    setError(null);
    setIsRecording(true);
    setRecordingTime(0);
    setHasRecorded(false);
    chunksRef.current = [];
    recordedBlobRef.current = null;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Try to prefer webm/opus (Chrome/Edge). Safari may ignore and use mp4.
      const options: MediaRecorderOptions = {};
      if (MediaRecorder.isTypeSupported("audio/webm;codecs=opus")) {
        options.mimeType = "audio/webm;codecs=opus";
      }

      const recorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const mime = recorder.mimeType || "audio/webm";
        recordedBlobRef.current = new Blob(chunksRef.current, { type: mime });

        // stop mic tracks
        stream.getTracks().forEach((t) => t.stop());

        setHasRecorded(true);
      };

      recorder.start();
    } catch (e: any) {
      setError(e?.message || "Microphone permission denied");
      setIsRecording(false);
      setHasRecorded(false);
    }
  };


  const handleStopRecording = async () => {
    setIsRecording(false);
    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state !== "inactive") recorder.stop();
  };


  const handleSubmit = async () => {
    setError(null);

    const blob = recordedBlobRef.current;
    if (!hasRecorded || !blob) {
      setError("No audio recorded.");
      return;
    }

    setBusy(true);
    try {
      // 1) Upload -> /api/recordings
      const sessionId =
        window.localStorage.getItem("sessionId") ||
        (() => {
          const id = crypto.randomUUID();
          window.localStorage.setItem("sessionId", id);
          return id;
        })();

      const form = new FormData();
      // filename extension helps your backend pick ext
      const ext = blob.type.includes("mp4") ? "m4a" : "webm";
      form.append("audio", blob, `recording.${ext}`);
      form.append("title", "Family Story");
      form.append("speakerName", ""); // optional

      const uploadRes = await fetch("/api/recordings", {
        method: "POST",
        headers: { "x-session-id": sessionId },
        body: form,
      });

      if (!uploadRes.ok) throw new Error(await uploadRes.text());
      const uploadJson = await uploadRes.json();
      const recordingId = uploadJson.recordingId;

      // 2) Trigger transcription -> /api/recordings/:id/transcribe
      const transcribeRes = await fetch(`/api/recordings/${recordingId}/transcribe`, {
        method: "POST",
      });

      if (!transcribeRes.ok) throw new Error(await transcribeRes.text());
      const transcribeJson = await transcribeRes.json();
      const transcriptText = transcribeJson.transcript ?? "";

      // 3) Navigate (better: just pass the recordingId)
      router.push(`/transcript?id=${recordingId}`);
    } catch (e: any) {
      setError(e?.message || "Transcription failed");
    } finally {
      setBusy(false);
    }
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
            disabled={busy}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-amber-900">Record a Family Story</h1>
            <p className="text-amber-700">Share memories that will last forever</p>
          </div>
        </motion.div>

        {/* Recording Card */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
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
                      <p className="text-xl text-amber-900 font-medium">Ready to capture a precious memory?</p>
                      <p className="text-amber-700">Press the microphone button to begin recording</p>
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
                      <p className="text-xl text-amber-900 font-medium">Recording your story...</p>
                      <p className="text-amber-700">Take your time and share your memories naturally</p>
                    </motion.div>
                  )}
                  {hasRecorded && !isRecording && (
                    <motion.div
                      key="complete"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                    >
                      <p className="text-xl text-amber-900 font-medium">Recording complete!</p>
                      <p className="text-amber-700">
                        {busy ? "Transcribing with Google Speech-to-Text..." : "Review and save your precious family story"}
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
                      />
                      <motion.div
                        animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                        transition={{ repeat: Infinity, duration: 1.5 }}
                        className="absolute inset-0 w-6 h-6 bg-red-500 rounded-full"
                      />
                    </div>
                    <span className="text-4xl font-mono text-amber-900 font-semibold">{formatTime(recordingTime)}</span>
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
                        disabled={busy}
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
                      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200, damping: 15 }}>
                        <CheckCircle className="w-24 h-24 mx-auto text-green-600" />
                      </motion.div>
                      <p className="text-amber-900 font-medium text-lg">Recording saved ({formatTime(recordingTime)})</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {error && <div className="text-center text-red-600">{error}</div>}

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
                      disabled={busy}
                      className="flex-1 border-2 border-amber-600 text-amber-900 hover:bg-amber-50"
                    >
                      Record Again
                    </Button>
                    <Button
                      onClick={handleSubmit}
                      disabled={busy}
                      className="flex-1 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 shadow-lg"
                    >
                      {busy ? "Transcribing..." : "View Transcript"}
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </Card>
        </motion.div>

        {/* Tips (unchanged) */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
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

/** ===== Helpers: PCM -> WAV 16k mono + base64 ===== */

function encodeWav16kMono(chunks: Float32Array[], inputSampleRate: number): Uint8Array {
  const input = concatFloat32(chunks);
  const targetRate = 16000;

  const resampled = resampleLinear(input, inputSampleRate, targetRate);
  const pcm16 = floatTo16BitPCM(resampled);

  const buffer = new ArrayBuffer(44 + pcm16.length * 2);
  const view = new DataView(buffer);

  writeString(view, 0, "RIFF");
  view.setUint32(4, 36 + pcm16.length * 2, true);
  writeString(view, 8, "WAVE");

  writeString(view, 12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, targetRate, true);
  view.setUint32(28, targetRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);

  writeString(view, 36, "data");
  view.setUint32(40, pcm16.length * 2, true);

  let offset = 44;
  for (let i = 0; i < pcm16.length; i++) {
    view.setInt16(offset, pcm16[i], true);
    offset += 2;
  }

  return new Uint8Array(buffer);
}

function concatFloat32(chunks: Float32Array[]): Float32Array {
  const total = chunks.reduce((acc, c) => acc + c.length, 0);
  const out = new Float32Array(total);
  let pos = 0;
  for (const c of chunks) {
    out.set(c, pos);
    pos += c.length;
  }
  return out;
}

function resampleLinear(input: Float32Array, inRate: number, outRate: number): Float32Array {
  if (inRate === outRate) return input;
  const ratio = inRate / outRate;
  const outLength = Math.floor(input.length / ratio);
  const out = new Float32Array(outLength);

  for (let i = 0; i < outLength; i++) {
    const idx = i * ratio;
    const i0 = Math.floor(idx);
    const i1 = Math.min(i0 + 1, input.length - 1);
    const frac = idx - i0;
    out[i] = input[i0] * (1 - frac) + input[i1] * frac;
  }
  return out;
}

function floatTo16BitPCM(input: Float32Array): Int16Array {
  const out = new Int16Array(input.length);
  for (let i = 0; i < input.length; i++) {
    const s = Math.max(-1, Math.min(1, input[i]));
    out[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }
  return out;
}

function writeString(view: DataView, offset: number, str: string) {
  for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}
