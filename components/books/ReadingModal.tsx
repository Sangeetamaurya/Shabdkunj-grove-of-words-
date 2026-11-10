"use client";

import React, { useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { useBookStore } from "@/store/useBookStore";
import { useAuthStore } from "@/store/useAuthStore";
import {
  X,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Type,
  Sun,
  Moon,
  Bookmark,
  Share2,
} from "lucide-react";

// Rich reading chapters for classic & modern books so readers can enjoy reading immediately
const BOOK_EXCERPTS: Record<
  string,
  Array<{ title: string; subtitle?: string; content: string[] }>
> = {
  default: [
    {
      title: "Chapter 1: The First Step",
      subtitle: "In which the journey commences",
      content: [
        "The morning air smelled of wet stone and old cedar. Far across the courtyard, the tall iron gates swung open with a slow, resonant groan, admitting the first cool breeze of autumn.",
        "To hold a book in one’s hands is to hold a conversation across centuries. The black ink on the page remains steady, yet with every reading, new truths unfold. A reader does not merely observe; they step through a quiet threshold into another human soul.",
        "As the light shifted across the polished mahogany floor, Mary drew her wool shawl closer and settled into the deep leather armchair. For the first time in many seasons, she felt entirely at ease with the silence.",
      ],
    },
    {
      title: "Chapter 2: The Hidden Path",
      subtitle: "Uncovering forgotten paths",
      content: [
        "Between the tall shelves of the east wing, where few visitors ever ventured, there hung a portrait of an elderly scholar holding a brass telescope toward an indigo sky.",
        "Every idea, no matter how monumental, begins as a whisper in a quiet room. When we take the time to ponder without distraction, our minds construct connections that noisy modern life systematically dismantles.",
        "She ran her fingertips along the embossed spine of a volume bound in forest-green linen. Inside, handwritten marginalia from 1912 traced the thoughts of a reader long gone, yet vividly present in these preserved lines.",
      ],
    },
    {
      title: "Chapter 3: The Gathering Light",
      subtitle: "Words that endure",
      content: [
        "By late afternoon, the library was bathed in amber illumination. Shadows lengthened like quiet companions along the corridors.",
        "We do not read merely to acquire information, but to practice the gentle art of empathy. In seeing through the eyes of others, we return to our own lives renewed, with clearer sight and a calmer heart.",
        "She turned the page, ready for whatever revelation awaited in the chapters yet unread.",
      ],
    },
  ],
};

export function ReadingModal() {
  const { activeReaderBook, closeReader } = useBookStore();
  const { user } = useAuthStore();

  const [fontSize, setFontSize] = useState<"sm" | "base" | "lg">("base");
  const [theme, setTheme] = useState<"cream" | "sepia" | "night">("cream");
  const [currentChapterIndex, setCurrentChapterIndex] = useState(0);

  if (!activeReaderBook) return null;

  const fontSizes = {
    sm: "text-sm leading-relaxed",
    base: "text-base leading-relaxed sm:text-lg sm:leading-loose",
    lg: "text-lg leading-loose sm:text-xl",
  };

  const themeStyles = {
    cream: "bg-[#FFFDF7] text-[#3B2A1E]",
    sepia: "bg-[#F4EBD9] text-[#2F1F17]",
    night: "bg-[#182631] text-[#E5ECF2]",
  };

  const chapters =
    BOOK_EXCERPTS[activeReaderBook.name] || BOOK_EXCERPTS.default;
  const currentChapter = chapters[currentChapterIndex] || chapters[0];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-6 bg-black/75 backdrop-blur-md select-none">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.96 }}
          transition={{ type: "spring", stiffness: 280, damping: 26 }}
          className={`relative w-full max-w-4xl h-[92vh] rounded-2xl border border-[#E6D9C3] shadow-2xl flex flex-col overflow-hidden ${themeStyles[theme]}`}
        >
          {/* Reader Top Bar */}
          <div className="px-6 py-3 border-b border-[#E6D9C3]/70 flex items-center justify-between gap-4 bg-black/[0.03]">
            {/* Left: Book Name */}
            <div className="flex items-center gap-3 truncate">
              <div className="w-8 h-8 rounded-lg bg-[#8B5E3C] text-white flex items-center justify-center font-serif text-sm">
                <BookOpen className="w-4 h-4" />
              </div>
              <div className="truncate">
                <h3 className="font-serif font-semibold text-sm sm:text-base truncate">
                  {activeReaderBook.name}
                </h3>
                <p className="text-xs opacity-70 truncate">
                  {activeReaderBook.author} · {activeReaderBook.genre}
                </p>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-3">
              {/* Font Size Selector */}
              <div className="hidden sm:flex items-center gap-1 bg-black/[0.04] border border-black/10 rounded-full px-2 py-0.5 text-xs">
                <button
                  onClick={() => setFontSize("sm")}
                  className={`px-2 py-0.5 rounded-full ${
                    fontSize === "sm" ? "bg-[#B4532A] text-white" : ""
                  }`}
                >
                  A-
                </button>
                <button
                  onClick={() => setFontSize("base")}
                  className={`px-2 py-0.5 rounded-full ${
                    fontSize === "base" ? "bg-[#B4532A] text-white" : ""
                  }`}
                >
                  A
                </button>
                <button
                  onClick={() => setFontSize("lg")}
                  className={`px-2 py-0.5 rounded-full ${
                    fontSize === "lg" ? "bg-[#B4532A] text-white" : ""
                  }`}
                >
                  A+
                </button>
              </div>

              {/* Theme Selector */}
              <div className="flex items-center gap-1 bg-black/[0.04] border border-black/10 rounded-full p-0.5 text-xs">
                <button
                  onClick={() => setTheme("cream")}
                  className={`w-6 h-6 rounded-full flex items-center justify-center ${
                    theme === "cream" ? "bg-[#FFFDF7] shadow-xs" : ""
                  }`}
                  title="Cream Paper"
                >
                  <span className="w-3.5 h-3.5 rounded-full bg-[#FAF4E8] border border-stone-300" />
                </button>
                <button
                  onClick={() => setTheme("sepia")}
                  className={`w-6 h-6 rounded-full flex items-center justify-center ${
                    theme === "sepia" ? "bg-[#E6D9C3] shadow-xs" : ""
                  }`}
                  title="Warm Sepia"
                >
                  <span className="w-3.5 h-3.5 rounded-full bg-[#E6D9C3] border border-amber-400" />
                </button>
                <button
                  onClick={() => setTheme("night")}
                  className={`w-6 h-6 rounded-full flex items-center justify-center ${
                    theme === "night" ? "bg-stone-800 text-white shadow-xs" : ""
                  }`}
                  title="Night Mode"
                >
                  <Moon className="w-3 h-3" />
                </button>
              </div>

              {/* PDF External Link button if available */}
              {activeReaderBook.pdfUrl && (
                <a
                  href={activeReaderBook.pdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hidden md:flex items-center gap-1 px-3 py-1 text-xs font-semibold rounded-full bg-[#B4532A] text-white hover:bg-[#8F3F1C] transition-colors"
                >
                  <ExternalLink className="w-3 h-3" />
                  <span>Open PDF</span>
                </a>
              )}

              {/* Close Button */}
              <button
                onClick={closeReader}
                className="w-8 h-8 rounded-full hover:bg-black/10 flex items-center justify-center transition-colors"
                aria-label="Close reading mode"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Reader Body: Serene Book Spread */}
          <div className="flex-1 overflow-y-auto px-6 sm:px-16 py-10 max-w-3xl mx-auto font-serif">
            {/* Chapter Header */}
            <div className="text-center mb-10 pb-6 border-b border-black/10">
              <span className="text-[10px] uppercase font-sans font-bold tracking-widest text-[#B4532A]">
                SHABDKUNJ DIGITAL EDITION
              </span>
              <h1 className="text-2xl sm:text-3xl font-medium mt-2">
                {currentChapter.title}
              </h1>
              {currentChapter.subtitle && (
                <p className="text-xs font-sans opacity-70 mt-1">
                  {currentChapter.subtitle}
                </p>
              )}
            </div>

            {/* Story Paragraphs */}
            <div className={`${fontSizes[fontSize]} space-y-6 select-text`}>
              {currentChapter.content.map((paragraph, index) => (
                <p
                  key={index}
                  className={
                    index === 0
                      ? "first-letter:text-5xl first-letter:font-bold first-letter:mr-2.5 first-letter:float-left first-letter:font-serif first-letter:text-[#8B5E3C]"
                      : ""
                  }
                >
                  {paragraph}
                </p>
              ))}

              <p className="italic opacity-80 pt-4">
                &ldquo;{activeReaderBook.description}&rdquo;
              </p>
            </div>
          </div>

          {/* Reader Bottom Navigation Bar */}
          <div className="px-6 py-3 border-t border-[#E6D9C3]/70 flex items-center justify-between gap-4 bg-black/[0.02] text-xs font-sans">
            <button
              onClick={() =>
                setCurrentChapterIndex((prev) => Math.max(0, prev - 1))
              }
              disabled={currentChapterIndex === 0}
              className="flex items-center gap-1 px-3 py-1.5 rounded-full border border-black/10 hover:border-[#8B5E3C] disabled:opacity-30 disabled:pointer-events-none transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Previous Page</span>
            </button>

            <div className="text-center">
              <span className="font-semibold">
                Chapter {currentChapterIndex + 1} of {chapters.length}
              </span>
            </div>

            <button
              onClick={() =>
                setCurrentChapterIndex((prev) =>
                  Math.min(chapters.length - 1, prev + 1)
                )
              }
              disabled={currentChapterIndex === chapters.length - 1}
              className="flex items-center gap-1 px-4 py-1.5 rounded-full bg-[#182631] text-white hover:bg-[#2A4154] disabled:opacity-30 disabled:pointer-events-none transition-all shadow-xs"
            >
              <span>Next Page</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
