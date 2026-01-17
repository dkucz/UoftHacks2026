"use client";

import React, { useRef, useState } from "react";

type Props = {
  onDone: (data: { id: string; title: string; transcript: string }) => void;
  languageCode?: string;
};

export default function TranscribeRecorder({ onDone, languageCode = "en-US" }: Props) {
  const [isRecording, setIsRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const timerRef = useRef<number | null>(null);

  // collect float32 PCM at device sample rate
  const buffersRef = useRef<Float32Array[]>([]);
  const inputSampleRateRef = useRef<number>(48000);

  function startTimer() {
    stopTimer();
    timerRef.current = window.setInterval(() => setSeconds((s) => s + 1), 1000);
  }
  function stopTimer() {
    if (timerRef.current) window.clearInterval(timerRef.current);
    timerRef.current = null;
  }

  async function start() {
    setErr(null);
    setSeconds(0);
    buffersRef.current = [];

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaStreamRef.current = stream;

    const AudioContextAny = window.AudioContext || (window as any).webkitAudioContext;
    const ctx = new AudioContextAny();
    audioCtxRef.current = ctx;

    inputSampleRateRef.current = ctx.sampleRate;

    const source = ctx.createMediaStreamSource(stream);
    sourceRef.current = source;

    // ScriptProcessor is deprecated but still widely supported & simplest for hackathons.
    const processor = ctx.createScriptProcessor(4096, 1, 1);
    processorRef.current = processor;

    processor.onaudioprocess = (e) => {
      const input = e.inputBuffer.getChannelData(0);
      buffersRef.current.push(new Float32Array(input));
    };

    source.connect(processor);
    processor.connect(ctx.destination);

    setIsRecording(true);
    startTimer();
  }

  async function stop() {
    setIsRecording(false);
    stopTimer();

    try {
      // cleanup audio nodes
      processorRef.current?.disconnect();
      sourceRef.current?.disconnect();
      processorRef.current = null;
      sourceRef.current = null;

      await audioCtxRef.current?.close();
      audioCtxRef.current = null;

      mediaStreamRef.current?.getTracks().forEach((t) => t.stop());
      mediaStreamRef.current = null;

      // Build WAV 16k mono from collected buffers
      const wavBytes = encodeWav16kMono(buffersRef.current, inputSampleRateRef.current);
      const wavBase64 = bytesToBase64(wavBytes);

      setBusy(true);
      const resp = await fetch("/api/transcribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wavBase64, languageCode }),
      });

      if (!resp.ok) throw new Error(await resp.text());
      const data = await resp.json();

      onDone(data);
    } catch (e: any) {
      setErr(e?.message || "Failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ display: "grid", gap: 12, maxWidth: 520 }}>
      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={start} disabled={isRecording || busy}>
          Start
        </button>
        <button onClick={stop} disabled={!isRecording || busy}>
          Stop & Transcribe
        </button>
      </div>

      <div>
        {isRecording ? "Recording..." : "Idle"} | {String(Math.floor(seconds / 60)).padStart(2, "0")}:
        {String(seconds % 60).padStart(2, "0")}
      </div>

      {busy && <div>Transcribing...</div>}
      {err && <div style={{ color: "red" }}>{err}</div>}
    </div>
  );
}

/** Resample float32 PCM -> 16k mono int16 WAV */
function encodeWav16kMono(chunks: Float32Array[], inputSampleRate: number): Uint8Array {
  const input = concatFloat32(chunks);
  const targetRate = 16000;

  const resampled = resampleLinear(input, inputSampleRate, targetRate);
  const pcm16 = floatTo16BitPCM(resampled);

  // WAV header (44 bytes) + PCM data
  const buffer = new ArrayBuffer(44 + pcm16.length * 2);
  const view = new DataView(buffer);

  // RIFF
  writeString(view, 0, "RIFF");
  view.setUint32(4, 36 + pcm16.length * 2, true);
  writeString(view, 8, "WAVE");

  // fmt
  writeString(view, 12, "fmt ");
  view.setUint32(16, 16, true); // PCM fmt chunk size
  view.setUint16(20, 1, true); // audio format PCM
  view.setUint16(22, 1, true); // channels
  view.setUint32(24, targetRate, true); // sample rate
  view.setUint32(28, targetRate * 2, true); // byte rate (sr * ch * bytesPerSample)
  view.setUint16(32, 2, true); // block align
  view.setUint16(34, 16, true); // bits per sample

  // data
  writeString(view, 36, "data");
  view.setUint32(40, pcm16.length * 2, true);

  // PCM samples
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

// Simple linear resampler (good enough for speech demo)
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
    let s = Math.max(-1, Math.min(1, input[i]));
    out[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }
  return out;
}

function writeString(view: DataView, offset: number, str: string) {
  for (let i = 0; i < str.length; i++) {
    view.setUint8(offset + i, str.charCodeAt(i));
  }
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}
