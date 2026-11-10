"use client";

import React, { useEffect, useState, useMemo, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Book } from "@/types";
import { useBookStore } from "@/store/useBookStore";
import { useAuthStore } from "@/store/useAuthStore";
import { BookRow } from "@/components/books/BookRow";
import * as api from "@/lib/api";
import { Search, Plus, BookOpen, Sparkles, X } from "lucide-react";

const PRIMARY_GENRES = [
  "Fiction",
  "Science",
  "Physics",
  "Love & Romance",
  "Knowledge",
  "About Life",
  "Philosophy",
  "History",
  "Mystery & Thriller",
  "Poetry",
  "Art & Design",
  "Technology",
  "Psychology",
  "Classics",
];

function BooksContent() {
  const searchParams = useSearchParams();
  const initialSearch = searchParams?.get("search") || "";

  const { user } = useAuthStore();
  const { openOverlay } = useBookStore();

  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [debouncedSearch, setDebouncedSearch] = useState(initialSearch);
  const [allBooks, setAllBooks] = useState<Book[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Debounce search query by 300ms
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Load books
  useEffect(() => {
    async function loadAllBooks() {
      setIsLoading(true);
      const data = await api.getBooks();
      setAllBooks(data);
      setIsLoading(false);
    }
    loadAllBooks();
  }, []);

  const isAdminOrLibrarian = user?.role === "admin" || user?.role === "librarian";

  // Filtered books for search results
  const searchResults = useMemo(() => {
    if (!debouncedSearch.trim()) return [];
    const q = debouncedSearch.toLowerCase().trim();
    return allBooks.filter(
      (b) =>
        b.name.toLowerCase().includes(q) ||
        b.author.toLowerCase().includes(q) ||
        b.genre.toLowerCase().includes(q)
    );
  }, [allBooks, debouncedSearch]);

  // Row queries
  const topBooks = useMemo(() => {
    return [...allBooks].sort((a, b) => b.likesCount - a.likesCount).slice(0, 15);
  }, [allBooks]);

  const trendingBooks = useMemo(() => {
    return [...allBooks]
      .sort((a, b) => {
        const scoreA = a.likesCount * 1.5 + new Date(a.createdAt).getTime() / 1e11;
        const scoreB = b.likesCount * 1.5 + new Date(b.createdAt).getTime() / 1e11;
        return scoreB - scoreA;
      })
      .slice(0, 15);
  }, [allBooks]);

  const featuredBook = allBooks[0];

  return (
    <div className="min-h-screen bg-[#FAF4E8] text-[#3B2A1E] pb-24">
      {/* ============================================================
          1. HERO HEADER (Matching 02-books-shelves.jpg)
          ============================================================ */}
      <section className="border-b border-[#E6D9C3]/70 pt-10 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Hero */}
          <div className="lg:col-span-7">
            <span className="text-xs uppercase tracking-widest text-[#B4532A] font-medium">
              CURATED FOR THOUGHTFUL READERS
            </span>
            <h1 className="font-serif text-3xl sm:text-5xl font-medium tracking-tight text-[#3B2A1E] mt-2 mb-4 leading-tight">
              Stories worth
              <br />
              getting lost in.
            </h1>
            <p className="text-sm text-[#7A6552] max-w-lg mb-8 leading-relaxed font-light">
              Explore a hand-picked collection of timeless classics, fresh discoveries,
              and ideas that stay with you across every genre.
            </p>

            {/* Instant Search Bar */}
            <div className="relative max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7A6552]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by title, author, or genre..."
                className="w-full pl-10 pr-10 py-3 bg-[#FFFDF7] border border-[#E6D9C3] rounded-full text-sm text-[#3B2A1E] placeholder:text-[#A48F7B] focus:outline-none focus:border-[#8B5E3C] focus:ring-1 focus:ring-[#8B5E3C] shadow-sm transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Right Hero: Featured Book Banner */}
          {featuredBook && (
            <div className="lg:col-span-5 bg-[#182631] text-[#FAF4E8] rounded-xl p-6 sm:p-7 shadow-warm-lg flex items-center gap-6 border border-stone-800">
              <div
                onClick={() => openOverlay(featuredBook)}
                className="w-24 sm:w-28 h-36 sm:h-40 rounded relative overflow-hidden shadow-md shrink-0 cursor-pointer hover:scale-105 transition-transform"
              >
                <Image
                  src={featuredBook.coverImage}
                  alt={featuredBook.name}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="flex-1">
                <span className="text-[10px] uppercase font-bold tracking-widest text-[#E2C37E]">
                  BOOK OF THE WEEK
                </span>
                <h3 className="font-serif text-xl sm:text-2xl font-medium mt-1 leading-snug">
                  {featuredBook.name}
                </h3>
                <p className="text-xs text-stone-300 mt-1 line-clamp-2">
                  {featuredBook.author} · {featuredBook.genre}
                </p>
                <button
                  onClick={() => openOverlay(featuredBook)}
                  className="text-xs text-[#E2C37E] hover:underline font-medium mt-3 inline-flex items-center gap-1"
                >
                  <span>Discover this classic</span>
                  <span>→</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ============================================================
          2. SHELVES SECTION (Matching 02-books-shelves.jpg)
          ============================================================ */}
      <main className="max-w-7xl mx-auto pt-10">
        <div className="flex items-center justify-between px-4 sm:px-6 lg:px-8 mb-4">
          <div>
            <span className="text-xs uppercase tracking-widest text-[#B4532A] font-medium">
              THE COLLECTION
            </span>
            <h2 className="font-serif text-2xl sm:text-3xl text-[#3B2A1E] font-medium mt-1">
              Browse the shelves
            </h2>
          </div>

          {/* Admin / Librarian '+ Add book' button */}
          {isAdminOrLibrarian && (
            <Link
              href="/admin/books/new"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-[#E6D9C3] bg-[#FFFDF7] hover:border-[#8B5E3C] text-xs font-semibold text-[#3B2A1E] transition-all shadow-xs"
            >
              <Plus className="w-3.5 h-3.5 text-[#B4532A]" />
              <span>Add book</span>
            </Link>
          )}
        </div>

        {/* Search Results Shelf or Complete Shelf Stack */}
        {debouncedSearch.trim() !== "" ? (
          /* Search Results */
          <div className="my-8">
            <div className="px-4 sm:px-6 lg:px-8 mb-4 flex items-center justify-between">
              <p className="text-sm text-[#7A6552]">
                Found <strong>{searchResults.length}</strong> matching &ldquo;
                <span className="text-[#3B2A1E]">{debouncedSearch}</span>&rdquo;
              </p>
              <button
                onClick={() => setSearchQuery("")}
                className="text-xs text-[#B4532A] hover:underline"
              >
                Clear search
              </button>
            </div>

            {searchResults.length > 0 ? (
              <BookRow
                title={`Results for "${debouncedSearch}"`}
                books={searchResults}
                onSelectBook={openOverlay}
                isAdminOrLibrarian={isAdminOrLibrarian}
              />
            ) : (
              <div className="text-center py-20 px-4 bg-[#FFFDF7] rounded-xl border border-[#E6D9C3] mx-4 sm:mx-8">
                <BookOpen className="w-10 h-10 text-[#8B5E3C] mx-auto mb-3 opacity-60" />
                <h3 className="font-serif text-xl font-medium text-[#3B2A1E]">
                  No matching books found
                </h3>
                <p className="text-xs text-[#7A6552] mt-1 max-w-sm mx-auto">
                  Try searching for another author, title, or explore our curated genre shelves.
                </p>
                <button
                  onClick={() => setSearchQuery("")}
                  className="mt-4 px-4 py-2 rounded-full bg-[#B4532A] text-white text-xs font-medium"
                >
                  Show all shelves
                </button>
              </div>
            )}
          </div>
        ) : (
          /* Normal Shelves Stack */
          <div className="space-y-4">
            {/* Top Books Row */}
            <BookRow
              title="Top Books"
              books={topBooks}
              onSelectBook={openOverlay}
              isAdminOrLibrarian={isAdminOrLibrarian}
            />

            {/* Trending Now Row */}
            <BookRow
              title="Trending Now"
              books={trendingBooks}
              onSelectBook={openOverlay}
              isAdminOrLibrarian={isAdminOrLibrarian}
            />

            {/* All Genre Rows (Prompt: "Hide a row if it has no books") */}
            {PRIMARY_GENRES.map((genre) => {
              const genreBooks = allBooks.filter(
                (b) => b.genre.toLowerCase() === genre.toLowerCase()
              );
              if (genreBooks.length === 0) return null;

              return (
                <BookRow
                  key={genre}
                  title={genre}
                  genreSlug={genre}
                  books={genreBooks}
                  onSelectBook={openOverlay}
                  isAdminOrLibrarian={isAdminOrLibrarian}
                />
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}

export default function BooksPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#FAF4E8] py-20 text-center">Loading shelves...</div>}>
      <BooksContent />
    </Suspense>
  );
}
