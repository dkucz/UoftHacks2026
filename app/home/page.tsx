"use client";

import { useRouter } from "next/navigation";
import { Button } from "../../shared/ui/button";
import { Card } from "../../shared/ui/card";
import { BookOpen, Mic, MessageSquare, Library, Heart, Users, Sparkles } from "lucide-react";
import { ImageWithFallback } from "../../shared/figma/ImageWithFallback";
import { motion } from "framer-motion";

export default function HomePage() {
  const router = useRouter();

  const handleNavigate = (screen: "record" | "library" | "home") => {
    if (screen === "record") {
      router.push("/record");
      return;
    }
    if (screen === "library") {
      router.push("/story");
      return;
    }
    router.push("/home");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 p-6">
      <div className="max-w-6xl mx-auto space-y-10">
        {/* Hero Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center space-y-6 pt-16 pb-8"
        >
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full shadow-xl mb-6">
              <BookOpen className="w-12 h-12 text-white" />
            </div>
          </motion.div>
          <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-orange-900 via-amber-900 to-rose-900 bg-clip-text text-transparent leading-tight">
            Family Capsule
          </h1>
          <p className="text-2xl text-amber-900 max-w-2xl mx-auto leading-relaxed">
            Preserve Your Family's Stories for Generations
          </p>
          <p className="text-lg text-amber-800/80 max-w-xl mx-auto">
            Capture the voices, memories, and wisdom of your loved ones before they fade away
          </p>
        </motion.div>

        {/* Main Actions */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="space-y-4 pb-12"
        >
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button 
              onClick={() => handleNavigate("record")}
              className="w-full py-8 text-xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 shadow-lg hover:shadow-xl transition-all duration-300"
              size="lg"
            >
              <Mic className="w-6 h-6 mr-3" />
              Record a Family Story
              <Sparkles className="w-5 h-5 ml-3" />
            </Button>
          </motion.div>

          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button 
              onClick={() => handleNavigate("library")}
              variant="outline"
              className="w-full py-6 text-lg border-2 border-amber-600 text-amber-900 hover:bg-amber-50 shadow-md hover:shadow-lg transition-all duration-300"
            >
              <Library className="w-5 h-5 mr-2" />
              Browse Family Library
              <Users className="w-5 h-5 ml-2" />
            </Button>
          </motion.div>
        </motion.div>

        {/* Image Banner */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="relative h-64 md:h-80 rounded-3xl overflow-hidden shadow-2xl"
        >
          <ImageWithFallback
            src="https://images.unsplash.com/photo-1587955793432-7c4ff80918ba?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmYW1pbHklMjBtZW1vcmllcyUyMHBob3RvJTIwYWxidW18ZW58MXx8fHwxNzY4NjYwNjQzfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
            alt="Family memories"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>
          <div className="absolute bottom-6 left-6 right-6 text-white">
            <p className="text-xl md:text-2xl font-semibold italic">
              "Every family has a story worth preserving"
            </p>
          </div>
        </motion.div>

        {/* Why it matters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <Card className="p-8 md:p-10 bg-white/90 backdrop-blur-sm shadow-xl border-2 border-amber-100">
            <div className="flex items-center gap-3 mb-6">
              <Heart className="w-8 h-8 text-rose-600" />
              <h2 className="text-3xl font-bold text-amber-900">
                Why Family Stories Matter
              </h2>
            </div>
            <p className="text-lg text-amber-800 leading-relaxed mb-6">
              Family Capsule helps you capture and preserve your family's precious stories, 
              memories, and wisdom. Record grandparents sharing their experiences, parents 
              recounting family traditions, or anyone sharing the moments that shaped your family's journey.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
              <motion.div 
                
                className="flex flex-col items-center text-center p-6 bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl shadow-md"
              >
                <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center mb-4">
                  <Mic className="w-8 h-8 text-white" />
                </div>
                <h3 className="font-semibold text-amber-900 mb-2">Record Stories</h3>
                <p className="text-sm text-amber-800">Capture family memories with simple voice recording</p>
              </motion.div>
              <motion.div 
                className="flex flex-col items-center text-center p-6 bg-gradient-to-br from-rose-50 to-pink-50 rounded-2xl shadow-md"
              >
                <div className="w-16 h-16 bg-gradient-to-br from-rose-400 to-pink-500 rounded-full flex items-center justify-center mb-4">
                  <MessageSquare className="w-8 h-8 text-white" />
                </div>
                <h3 className="font-semibold text-amber-900 mb-2">Ask Questions</h3>
                <p className="text-sm text-amber-800">Explore and understand your family's history</p>
              </motion.div>
              <motion.div 
                className="flex flex-col items-center text-center p-6 bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl shadow-md"
              >
                <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-amber-500 rounded-full flex items-center justify-center mb-4">
                  <Library className="w-8 h-8 text-white" />
                </div>
                <h3 className="font-semibold text-amber-900 mb-2">Build Archive</h3>
                <p className="text-sm text-amber-800">Create a lasting legacy for future generations</p>
              </motion.div>
            </div>
          </Card>
        </motion.div>

        
      </div>
    </div>
  );
}