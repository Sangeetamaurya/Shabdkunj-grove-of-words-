"use client";

import React, { useEffect, useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Book } from "@/types";
import { useBookStore } from "@/store/useBookStore";
import { useToast } from "@/components/ui/Toast";
import * as api from "@/lib/api";
import { ArrowLeft, Heart, Sparkles, BookOpen } from "lucide-react";

type SortTab = "latest" | "top" | "trending";

export default function GenrePage() {
  const params = useParams();
  const rawGenre = (params.genre as string) || "Fiction";
  const genre = decodeURIComponent(rawGenre);

  const { openOverlay } = useBookStore();
  const { error: showError } = useToast();
  const [books, setBooks] = useState<Book[]>([]);
  const [activeTab, setActiveTab] = useState<SortTab>("latest");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadGenreBooks() {
      setIsLoading(true);
      try {
        const data = await api.getBooks({ genre, sort: activeTab });
        setBooks(data);
      } catch (err: any) {
        setBooks([]);
        showError(err.message || "Failed to load books");
      } finally {
        setIsLoading(false);
      }
    }
    loadGenreBooks();
  }, [genre, activeTab, showError]);

  const tabs: Array<{ id: SortTab; label: string }> = [
    { id: "latest", label: "Latest" },
    { id: "top", label: "Top Liked" },
    { id: "trending", label: "Trending" },
  ];

  return (
    <div className="min-h-screen bg-[#FAF4E8] text-[#3B2A1E] py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Back navigation */}
        <Link
          href="/books"
          className="inline-flex items-center gap-2 text-xs font-medium text-[#7A6552] hover:text-[#B4532A] transition-colors mb-6 group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span>Back to shelves</span>
        </Link>

        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-[#E6D9C3]">
          <div>
            <span className="text-xs uppercase tracking-widest text-[#B4532A] font-semibold">
              GENRE COLLECTION
            </span>
            <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-medium mt-1">
              {genre}
            </h1>
            <p className="text-sm text-[#7A6552] mt-2 max-w-xl">
              Curated masterworks, provocative perspectives, and celebrated editions in {genre}.
            </p>
          </div>

          {/* Animated Sliding Underline Sort Tabs */}
          <div className="flex items-center gap-1 bg-[#FFFDF7] p-1 rounded-full border border-[#E6D9C3] shadow-xs">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative px-4 py-1.5 rounded-full text-xs font-medium transition-colors ${
                    isActive ? "text-[#FAF4E8]" : "text-[#7A6552] hover:text-[#3B2A1E]"
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="active-genre-tab-pill"
                      className="absolute inset-0 bg-[#B4532A] rounded-full shadow-xs"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                  <span className="relative z-10">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Books Cover Grid (Not Spines) */}
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6 mt-10">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-[2/3] bg-[#E6D9C3]/50 rounded-lg mb-3" />
                <div className="h-4 bg-[#E6D9C3]/70 rounded w-3/4 mb-1.5" />
                <div className="h-3 bg-[#E6D9C3]/40 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : books.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6 mt-10">
            {books.map((book) => (
              <motion.div
                key={book.id}
                whileHover={{ y: -6, scale: 1.02 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                onClick={() => openOverlay(book)}
                className="group cursor-pointer flex flex-col"
              >
                <div className="relative aspect-[2/3] rounded-lg overflow-hidden shadow-warm group-hover:shadow-warm-lg transition-all border border-[#E6D9C3] bg-[#FFFDF7]">
                  <Image
                    src={book.coverImage}
                    alt={book.name}
                    fill
                    sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 20vw"
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-xs text-white text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Heart className="w-3 h-3 fill-rose-500 text-rose-500" />
                    <span>{book.likesCount}</span>
                  </div>
                </div>

                <div className="mt-3">
                  <h3 className="font-serif text-sm sm:text-base font-medium text-[#3B2A1E] truncate group-hover:text-[#B4532A] transition-colors">
                    {book.name}
                  </h3>
                  <p className="text-xs text-[#7A6552] truncate">{book.author}</p>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-24 bg-[#FFFDF7] rounded-xl border border-[#E6D9C3] mt-10">
            <BookOpen className="w-12 h-12 text-[#8B5E3C] mx-auto mb-3 opacity-50" />
            <h2 className="font-serif text-xl font-medium text-[#3B2A1E]">
              No books in this genre yet
            </h2>
            <p className="text-xs text-[#7A6552] mt-1">
              Check back soon as our librarians curate new editions.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
