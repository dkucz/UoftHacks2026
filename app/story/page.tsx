"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "../../shared/ui/button";
import { Card } from "../../shared/ui/card";
import { ArrowLeft, MessageSquare, Clock, Globe, Heart, Sparkles } from "lucide-react";
import { motion } from "motion/react";

interface Story {
  id: string;
  title: string;
  excerpt: string;
  date: string;
  language: string;
  duration: string;
}

const mockStories: Story[] = [
  {
    id: '1',
    title: 'Grandma\'s Immigration Story',
    excerpt: 'I remember when I was just a little girl, growing up in the old neighborhood. Your great-grandfather used to walk me to school...',
    date: 'January 15, 2026',
    language: 'English',
    duration: '5:23',
  },
  {
    id: '2',
    title: 'Dad\'s First Job',
    excerpt: 'It was the summer of 1985, and I needed money for college. I walked into that hardware store with my resume...',
    date: 'January 12, 2026',
    language: 'English',
    duration: '7:45',
  },
  {
    id: '3',
    title: 'The Family Recipe Secret',
    excerpt: 'Your great-grandmother never wrote anything down. She said cooking was about feeling, not measuring...',
    date: 'January 10, 2026',
    language: 'English',
    duration: '4:12',
  },
  {
    id: '4',
    title: 'How Mom and Dad Met',
    excerpt: 'We both reached for the same book at the library. I know it sounds like a movie, but that\'s exactly what happened...',
    date: 'January 8, 2026',
    language: 'English',
    duration: '6:34',
  },
];

export default function StoryLibraryPage() {
  const router = useRouter();
  const [stories, setStories] = useState<Story[]>([]);

  useEffect(() => {
    const stored = window.localStorage.getItem("family-stories");
    if (!stored) return;
    try {
      const parsed = JSON.parse(stored) as Story[];
      if (Array.isArray(parsed)) {
        setStories(parsed);
      }
    } catch {
      setStories([]);
    }
  }, []);

  const displayStories = stories.length > 0 ? stories : mockStories;

  const handleStoryClick = (story: Story) => {
    const params = new URLSearchParams({
      transcript: `${story.excerpt} [Full story content would be loaded here...]`,
      title: story.title,
    });
    router.push(`/chat?${params.toString()}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
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
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-bold text-amber-900">Family Library</h1>
              <Heart className="w-7 h-7 text-rose-600" />
            </div>
            <p className="text-amber-700">
              {displayStories.length} precious {displayStories.length === 1 ? 'story' : 'stories'} preserving your memories
            </p>
          </div>
        </motion.div>

        {/* Stories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {displayStories.map((story, index) => (
            <motion.div
              key={story.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -5 }}
            >
              <Card
                className="p-6 bg-white/90 backdrop-blur-sm hover:shadow-xl transition-all duration-300 cursor-pointer border-2 border-amber-100 hover:border-amber-300"
                onClick={() => handleStoryClick(story)}
              >
                <div className="space-y-4">
                  <div>
                    <div className="flex items-start gap-3 mb-3">
                      <Sparkles className="w-5 h-5 text-amber-600 flex-shrink-0 mt-1" />
                      <h3 className="text-xl font-semibold text-amber-900">
                        {story.title}
                      </h3>
                    </div>
                    <p className="text-amber-800 text-sm line-clamp-3 leading-relaxed font-serif italic">
                      "{story.excerpt}"
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-4 text-sm text-amber-700 border-t border-amber-200 pt-4">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-amber-600" />
                      <span>{story.duration}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Globe className="w-4 h-4 text-amber-600" />
                      <span>{story.language}</span>
                    </div>
                    <div className="text-amber-600 font-medium">
                      {story.date}
                    </div>
                  </div>

                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button
                      className="w-full gap-2 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 shadow-md"
                      onClick={(e: any) => {
                        e.stopPropagation();
                        handleStoryClick(story);
                      }}
                    >
                      <MessageSquare className="w-4 h-4" />
                      Explore This Story
                    </Button>
                  </motion.div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Empty State */}
        {displayStories.length === 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <Card className="p-12 bg-white/80 backdrop-blur-sm text-center border-2 border-amber-200">
              <Heart className="w-16 h-16 mx-auto text-rose-500 mb-4" />
              <p className="text-xl text-amber-900 mb-2 font-semibold">
                Your family story collection awaits
              </p>
              <p className="text-amber-800 mb-6">
                Start preserving your precious family memories today!
              </p>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  onClick={() => router.push("/record")}
                  className="bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700"
                >
                  Record Your First Story
                </Button>
              </motion.div>
            </Card>
          </motion.div>
        )}

        {/* Info Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="p-6 bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200">
            <div className="flex items-start gap-3">
              <Sparkles className="w-6 h-6 text-amber-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-amber-900 mb-2">About Your Family Library</h3>
                <p className="text-sm text-amber-800 leading-relaxed">
                  Each story in this library is a precious piece of your family's history. 
                  Click on any story to ask AI questions about its content - perfect for exploring 
                  details, understanding context, or finding specific information from your family's recordings.
                </p>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}