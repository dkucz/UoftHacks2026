"use client";

import { useMemo, useState, useRef, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "../../shared/ui/button";
import { Card } from "../../shared/ui/card";
import { Input } from "../../shared/ui/input";
import { ArrowLeft, Send, Bot, User, Sparkles } from "lucide-react";
import { ScrollArea } from "../../shared/ui/scroll-area";
import { motion, AnimatePresence } from "motion/react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export default function ChatClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const recordingId = useMemo(
    () => searchParams.get("id") ?? "",
    [searchParams]
  );

  const title = useMemo(
    () => searchParams.get("title") ?? "Family Story",
    [searchParams]
  );
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content: `Hello! I'm here to help you explore "${title}". Feel free to ask any questions about the story, and I'll provide answers based on its content.`,
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (!recordingId) {
      setErrorMessage("Missing recording id. Please go back and open a story again.");
      return;
    }
    
    if (!inputValue.trim()) return;
    setErrorMessage(null);

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: inputValue,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsTyping(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recordingId,
          messages: [...messages, userMessage].map((message) => ({
            role: message.role,
            content: message.content,
          })),
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
<<<<<<< HEAD
        console.error("API /api/chat failed:", response.status, errText);
        setErrorMessage(`Chat API error ${response.status}: ${errText}`);
        return;
=======
        throw new Error(errText || "Chat failed");
>>>>>>> 2285c02 (Fixed Gemini Chat)
      }

      const data = (await response.json()) as { reply?: string; error?: string };
      if (!data.reply) {
        throw new Error(data.error || "No response from model.");
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.reply,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error(error);
      setErrorMessage("We couldn't reach the model. Please try again in a moment.");
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 p-6">
      <div className="max-w-4xl mx-auto h-[calc(100vh-3rem)] flex flex-col space-y-4">
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
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-bold text-amber-900">Chat with Memory</h1>
              <Sparkles className="w-6 h-6 text-amber-600" />
            </div>
            <p className="text-sm text-amber-700">Based on: {title}</p>
          </div>
        </motion.div>

        {/* Chat Messages */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex-1"
        >
          <Card className="h-full flex flex-col bg-white/90 backdrop-blur-sm shadow-xl border-2 border-amber-100 overflow-hidden">
            <ScrollArea className="flex-1 p-6" ref={scrollRef}>
              <div className="space-y-6">
                <AnimatePresence>
                  {messages.map((message, index) => (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 20, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ delay: index * 0.05 }}
                      className={`flex gap-3 ${
                        message.role === "user" ? "flex-row-reverse" : "flex-row"
                      }`}
                    >
                      <motion.div
                        whileHover={{ scale: 1.1 }}
                        className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 shadow-md ${
                          message.role === "user"
                            ? "bg-gradient-to-br from-orange-500 to-amber-500"
                            : "bg-gradient-to-br from-purple-500 to-pink-500"
                        }`}
                      >
                        {message.role === "user" ? (
                          <User className="w-5 h-5 text-white" />
                        ) : (
                          <Bot className="w-5 h-5 text-white" />
                        )}
                      </motion.div>
                      <div
                        className={`max-w-[75%] rounded-2xl p-4 shadow-md ${
                          message.role === "user"
                            ? "bg-gradient-to-br from-orange-600 to-amber-600 text-white"
                            : "bg-gradient-to-br from-purple-50 to-pink-50 text-amber-900 border-2 border-purple-100"
                        }`}
                      >
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">
                          {message.content}
                        </p>
                        <span
                          className={`text-xs mt-2 block ${
                            message.role === "user" ? "opacity-80" : "opacity-60"
                          }`}
                        >
                          {message.timestamp.toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>

                <AnimatePresence>
                  {isTyping && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="flex gap-3"
                    >
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0 shadow-md">
                        <Bot className="w-5 h-5 text-white" />
                      </div>
                      <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-4 border-2 border-purple-100">
                        <div className="flex gap-1.5">
                          <motion.div
                            animate={{ y: [0, -8, 0] }}
                            transition={{ repeat: Infinity, duration: 0.6, delay: 0 }}
                            className="w-2 h-2 bg-purple-500 rounded-full"
                          ></motion.div>
                          <motion.div
                            animate={{ y: [0, -8, 0] }}
                            transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }}
                            className="w-2 h-2 bg-purple-500 rounded-full"
                          ></motion.div>
                          <motion.div
                            animate={{ y: [0, -8, 0] }}
                            transition={{ repeat: Infinity, duration: 0.6, delay: 0.4 }}
                            className="w-2 h-2 bg-purple-500 rounded-full"
                          ></motion.div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </ScrollArea>

            {errorMessage && (
              <div className="px-6 pb-2 text-sm text-rose-700">{errorMessage}</div>
            )}

            {/* Input Area */}
            <div className="p-4 border-t-2 border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50">
              <div className="flex gap-2">
                <Input
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask a question about the story..."
                  className="flex-1 border-2 border-amber-200 focus:border-amber-400 bg-white"
                  disabled={isTyping}
                />
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button
                    onClick={handleSendMessage}
                    disabled={!inputValue.trim() || isTyping}
                    className="bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 shadow-md"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </motion.div>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-600" />
              <p className="text-xs text-amber-800">
                Ask questions to explore details, understand context, or find specific
                information from this family story
              </p>
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
