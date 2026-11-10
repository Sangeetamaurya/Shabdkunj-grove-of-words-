"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Book, Article } from "@/types";
import { useBookStore } from "@/store/useBookStore";
import * as api from "@/lib/api";
import {
  ArrowRight,
  BookOpen,
  Library,
  Bookmark,
  Sparkles,
  Heart,
  ChevronRight,
} from "lucide-react";

export default function HomePage() {
  const { openOverlay } = useBookStore();
  const [favoriteBooks, setFavoriteBooks] = useState<Book[]>([]);
  const [featuredArticle, setFeaturedArticle] = useState<Article | null>(null);

  useEffect(() => {
    async function loadHomeData() {
      // Load top books for Readers' favorites
      const books = await api.getBooks({ sort: "top", limit: 4 });
      setFavoriteBooks(books);

      // Load featured article
      const articles = await api.getArticles({ limit: 1 });
      if (articles.length > 0) {
        setFeaturedArticle(articles[0]);
      }
    }
    loadHomeData();
  }, []);

  const secretGardenBook = favoriteBooks.find((b) => b.name.includes("Secret Garden")) || favoriteBooks[0];

  return (
    <div className="min-h-screen bg-[#FAF4E8] text-[#3B2A1E]">
      {/* ============================================================
          1. HERO SECTION (Matching 01-home.jpg)
          ============================================================ */}
      <section className="relative overflow-hidden border-b border-[#E6D9C3]/70">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 min-h-[580px]">
          {/* Left Hero Column */}
          <div className="lg:col-span-7 px-4 sm:px-8 lg:px-12 py-16 sm:py-20 flex flex-col justify-center">
            <div className="inline-flex items-center gap-2 mb-4">
              <span className="text-xs uppercase tracking-widest text-[#B4532A] font-medium font-sans">
                — YOUR LITERARY SANCTUARY
              </span>
            </div>

            <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-medium tracking-tight leading-[1.12] text-[#3B2A1E] mb-6">
              Where every word
              <br />
              finds a <span className="italic font-normal text-[#B4532A]">home.</span>
            </h1>

            <p className="text-base sm:text-lg text-[#7A6552] max-w-xl leading-relaxed mb-8 font-light">
              Discover remarkable books, collect the stories that move you, and join
              a community built around the joy of reading.
            </p>

            <div className="flex flex-wrap items-center gap-4 mb-10">
              <Link
                href="/books"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#182631] hover:bg-[#2A4154] text-[#FAF4E8] text-sm font-medium transition-all shadow-sm group"
              >
                <span>Enter the library</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </Link>
              <Link
                href="/articles"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-transparent hover:bg-[#FAF4E8] text-[#3B2A1E] text-sm font-medium border border-[#E6D9C3] hover:border-[#8B5E3C] transition-colors"
              >
                <span>Browse the journal</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Community Social Proof */}
            <div className="flex items-center gap-3 pt-4">
              <div className="flex -space-x-2 overflow-hidden">
                <div className="inline-block h-8 w-8 rounded-full ring-2 ring-[#FAF4E8] bg-[#6E2B27] text-white flex items-center justify-center text-xs font-serif">
                  A
                </div>
                <div className="inline-block h-8 w-8 rounded-full ring-2 ring-[#FAF4E8] bg-[#234133] text-white flex items-center justify-center text-xs font-serif">
                  M
                </div>
                <div className="inline-block h-8 w-8 rounded-full ring-2 ring-[#FAF4E8] bg-[#8A5A1A] text-white flex items-center justify-center text-xs font-serif">
                  K
                </div>
              </div>
              <span className="text-xs text-[#7A6552]">
                <strong className="text-[#3B2A1E] font-medium">6,200+</strong> curious readers gathered here
              </span>
            </div>
          </div>

          {/* Right Hero Column: Slanted Navy Banner & Book of the Week */}
          <div className="lg:col-span-5 relative bg-[#182631] text-[#FAF4E8] p-8 sm:p-12 flex flex-col justify-center overflow-hidden">
            {/* Watermark Hindi character */}
            <div className="absolute right-4 top-2 text-[140px] font-serif font-bold text-white/[0.04] select-none pointer-events-none">
              शब्द
            </div>

            {secretGardenBook && (
              <div className="relative z-10 flex flex-col sm:flex-row items-center gap-6">
                <motion.div
                  whileHover={{ scale: 1.05, rotate: -2 }}
                  transition={{ type: "spring", stiffness: 300 }}
                  onClick={() => openOverlay(secretGardenBook)}
                  className="w-40 sm:w-48 h-60 sm:h-72 rounded-md shadow-2xl relative overflow-hidden shrink-0 cursor-pointer border border-amber-900/40"
                >
                  <Image
                    src={secretGardenBook.coverImage}
                    alt={secretGardenBook.name}
                    fill
                    className="object-cover"
                    priority
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
                </motion.div>

                <div className="text-left">
                  <div className="text-[10px] uppercase tracking-widest text-[#E2C37E] font-bold mb-1">
                    BOOK OF THE WEEK
                  </div>
                  <h3 className="font-serif text-2xl sm:text-3xl font-medium mb-2 leading-snug">
                    {secretGardenBook.name}
                  </h3>
                  <p className="text-xs text-stone-300 leading-relaxed font-light mb-4 line-clamp-3">
                    {secretGardenBook.description}
                  </p>
                  <button
                    onClick={() => openOverlay(secretGardenBook)}
                    className="inline-flex items-center gap-1.5 text-xs text-[#E2C37E] hover:underline font-medium"
                  >
                    <span>Open the book</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* Circular Stamp */}
            <div className="absolute bottom-6 right-6 w-16 h-16 rounded-full border border-white/20 flex items-center justify-center text-[9px] uppercase tracking-widest text-white/40 text-center font-mono">
              CURATED
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================
          2. STATS TICKER (Matching 01-home.jpg)
          ============================================================ */}
      <section className="border-b border-[#E6D9C3]/70 bg-[#FAF4E8] py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-2 md:grid-cols-4 gap-6 text-center divide-x divide-[#E6D9C3]/60">
          <div>
            <div className="font-serif text-2xl sm:text-3xl text-[#3B2A1E] font-medium">12,000+</div>
            <div className="text-xs text-[#7A6552] uppercase tracking-wider mt-1">Books on our shelves</div>
          </div>
          <div>
            <div className="font-serif text-2xl sm:text-3xl text-[#3B2A1E] font-medium">840</div>
            <div className="text-xs text-[#7A6552] uppercase tracking-wider mt-1">Journal essays</div>
          </div>
          <div>
            <div className="font-serif text-2xl sm:text-3xl text-[#3B2A1E] font-medium">62</div>
            <div className="text-xs text-[#7A6552] uppercase tracking-wider mt-1">Reading circles</div>
          </div>
          <div>
            <div className="font-serif text-2xl sm:text-3xl text-[#3B2A1E] font-medium">Every week</div>
            <div className="text-xs text-[#7A6552] uppercase tracking-wider mt-1">Fresh recommendations</div>
          </div>
        </div>
      </section>

      {/* ============================================================
          3. FEATURE CARDS (The Library, The Journal, Reading Board)
          ============================================================ */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-12">
          <div>
            <span className="text-xs uppercase tracking-widest text-[#B4532A] font-medium">
              FIND YOURSELF AT HOME
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl text-[#3B2A1E] font-normal mt-2">
              There&apos;s more than one way
              <br />
              to get lost in words.
            </h2>
          </div>
          <p className="text-xs text-[#7A6552] mt-4 sm:mt-0 max-w-xs">
            Find your next book, muse a few lines, or return to the stories already waiting for you.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: The Library */}
          <Link
            href="/books"
            className="group p-8 rounded-card bg-[#F4EBD9]/60 border border-[#E6D9C3] hover:border-[#8B5E3C] transition-all flex flex-col justify-between min-h-[300px] shadow-xs hover:shadow-warm"
          >
            <div>
              {/* Illustration of vertical books */}
              <div className="flex items-end gap-1.5 h-20 mb-8 border-b-2 border-[#8B5E3C] pb-1">
                <div className="w-4 h-16 bg-[#1D3147] rounded-t-xs" />
                <div className="w-5 h-12 bg-[#8A5A1A] rounded-t-xs" />
                <div className="w-4 h-18 bg-[#234133] rounded-t-xs" />
                <div className="w-4 h-14 bg-[#6E2B27] rounded-t-xs" />
                <div className="w-5 h-10 bg-[#873E23] rounded-t-xs" />
              </div>
              <h3 className="font-serif text-2xl font-medium text-[#3B2A1E] group-hover:text-[#B4532A] transition-colors">
                The Library
              </h3>
              <p className="text-xs text-[#7A6552] mt-2 leading-relaxed">
                Wander through our shelves from classics to tomorrow&apos;s emerging ideas.
              </p>
            </div>
            <div className="flex items-center gap-1 text-xs font-medium text-[#B4532A] mt-6">
              <span>Enter shelves</span>
              <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          {/* Card 2: The Journal (Dark Navy Card) */}
          <Link
            href="/articles"
            className="group p-8 rounded-card bg-[#182631] text-[#FAF4E8] border border-stone-800 transition-all flex flex-col justify-between min-h-[300px] shadow-warm hover:shadow-warm-lg"
          >
            <div>
              <div className="text-xs text-amber-200/80 uppercase tracking-widest font-mono mb-4">
                02
              </div>
              <p className="font-serif italic text-xl sm:text-2xl font-normal leading-snug mb-6 text-stone-100">
                &ldquo;We read to know we are not alone.&rdquo;
              </p>
              <h3 className="font-serif text-xl font-medium text-[#E2C37E]">
                The Journal
              </h3>
              <p className="text-xs text-stone-300 mt-2 leading-relaxed">
                Intimate essays and fresh perspectives from thoughtful readers and writers.
              </p>
            </div>
            <div className="flex items-center gap-1 text-xs font-medium text-[#E2C37E] mt-6">
              <span>Read essays</span>
              <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          {/* Card 3: Your Reading Board */}
          <Link
            href="/profile"
            className="group p-8 rounded-card bg-[#F4EBD9]/60 border border-[#E6D9C3] hover:border-[#8B5E3C] transition-all flex flex-col justify-between min-h-[300px] shadow-xs hover:shadow-warm"
          >
            <div>
              {/* Stacked books illustration */}
              <div className="relative h-20 mb-8 flex items-center justify-center">
                <div className="w-16 h-12 bg-stone-100 border border-stone-300 rounded shadow-xs rotate-[-12deg] absolute" />
                <div className="w-16 h-12 bg-[#B4532A] rounded shadow-xs rotate-[8deg] absolute" />
                <div className="w-16 h-12 bg-[#182631] rounded shadow-sm rotate-[-2deg] absolute" />
              </div>
              <h3 className="font-serif text-2xl font-medium text-[#3B2A1E] group-hover:text-[#B4532A] transition-colors">
                Your Reading Board
              </h3>
              <p className="text-xs text-[#7A6552] mt-2 leading-relaxed">
                Keep a calm, beautiful record of what you&apos;re reading, savoring, and planning.
              </p>
            </div>
            <div className="flex items-center gap-1 text-xs font-medium text-[#B4532A] mt-6">
              <span>View board</span>
              <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>
        </div>
      </section>

      {/* ============================================================
          4. READERS' FAVORITES (Matching 01-home.jpg)
          ============================================================ */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-[#E6D9C3]/70">
        <div className="flex items-center justify-between mb-8">
          <div>
            <span className="text-xs uppercase tracking-widest text-[#B4532A] font-medium">
              A LITTLE TASTE OF OUR SHELVES
            </span>
            <h2 className="font-serif text-2xl sm:text-3xl text-[#3B2A1E] font-medium mt-1">
              Readers&apos; favorites
            </h2>
          </div>
          <Link
            href="/books"
            className="flex items-center gap-1 text-xs text-[#7A6552] hover:text-[#B4532A] transition-colors"
          >
            <span>Explore all books</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* 4 Cards Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
          {favoriteBooks.slice(0, 4).map((book) => (
            <motion.div
              key={book.id}
              whileHover={{ y: -8 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              onClick={() => openOverlay(book)}
              className="group cursor-pointer flex flex-col"
            >
              <div className="relative w-full aspect-[2/3] rounded-md overflow-hidden shadow-warm hover:shadow-warm-lg transition-shadow border border-[#E6D9C3] bg-[#FFFDF7]">
                <Image
                  src={book.coverImage}
                  alt={book.name}
                  fill
                  sizes="(max-width: 768px) 50vw, 25vw"
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div className="mt-3">
                <span className="text-[10px] uppercase font-bold tracking-wider text-[#B4532A]">
                  {book.genre}
                </span>
                <h4 className="font-serif text-base font-medium text-[#3B2A1E] truncate group-hover:text-[#B4532A] transition-colors">
                  {book.name}
                </h4>
                <p className="text-xs text-[#7A6552] truncate">{book.author}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ============================================================
          5. ESSAY SPOTLIGHT BANNER (Matching 01-home.jpg)
          ============================================================ */}
      {featuredArticle && (
        <section className="py-16 border-t border-[#E6D9C3]/70 bg-[#F4EBD9]/40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
            {/* Left Photo of Open Book with Tea */}
            <div className="md:col-span-6 relative aspect-[4/3] rounded-xl overflow-hidden shadow-warm-lg">
              <Image
                src={featuredArticle.image || "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=800&auto=format&fit=crop&q=80"}
                alt="Reading sanctuary"
                fill
                className="object-cover"
              />
            </div>

            {/* Right Text */}
            <div className="md:col-span-6 flex flex-col justify-center">
              <span className="text-xs uppercase tracking-widest text-[#B4532A] font-semibold">
                ESSAY OF THE WEEK · {featuredArticle.readTime || "6 MIN READ"}
              </span>
              <h2 className="font-serif text-3xl sm:text-4xl font-medium text-[#3B2A1E] mt-3 leading-tight">
                {featuredArticle.title}
              </h2>
              <p className="text-sm text-[#7A6552] leading-relaxed mt-4 font-normal">
                {featuredArticle.subtitle}
              </p>

              <div className="flex items-center gap-3 mt-6 mb-8">
                <div className="w-7 h-7 rounded-full bg-[#B4532A] text-white flex items-center justify-center font-serif text-xs">
                  {featuredArticle.authorName[0]}
                </div>
                <div className="text-xs">
                  <div className="font-semibold text-[#3B2A1E]">
                    {featuredArticle.authorName}
                  </div>
                  <div className="text-[#7A6552]">Senior Curator</div>
                </div>
              </div>

              <Link
                href={`/articles/${featuredArticle.id}`}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#182631] hover:bg-[#2A4154] text-[#FAF4E8] text-sm font-medium transition-all shadow-sm w-fit"
              >
                <span>Read the full essay</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
