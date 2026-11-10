"use client";

import React, { useRef, useState, useEffect } from "react";
import Link from "next/link";
import { Book } from "@/types";
import { BookSpine } from "./BookSpine";
import { ChevronLeft, ChevronRight, ChevronRight as ArrowRight } from "lucide-react";

interface BookRowProps {
  title: string;
  genreSlug?: string;
  books: Book[];
  onSelectBook: (book: Book) => void;
  onEditBook?: (book: Book) => void;
  onDeleteBook?: (book: Book) => void;
  isAdminOrLibrarian?: boolean;
}

export function BookRow({
  title,
  genreSlug,
  books,
  onSelectBook,
  onEditBook,
  onDeleteBook,
  isAdminOrLibrarian,
}: BookRowProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [isRowHovered, setIsRowHovered] = useState(false);

  // Check scroll position to enable/disable buttons
  const checkScroll = () => {
    const el = scrollContainerRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 10);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 10);
  };

  useEffect(() => {
    checkScroll();
    const el = scrollContainerRef.current;
    if (el) {
      el.addEventListener("scroll", checkScroll, { passive: true });
      return () => el.removeEventListener("scroll", checkScroll);
    }
  }, [books]);

  const scroll = (direction: "left" | "right") => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const distance = el.clientWidth * 0.8;
    el.scrollBy({
      left: direction === "left" ? -distance : distance,
      behavior: "smooth",
    });
  };

  if (!books || books.length === 0) {
    return null; // Prompt requirement: "Hide a row if it has no books"
  }

  const seeAllHref = genreSlug
    ? `/books/genre/${encodeURIComponent(genreSlug)}`
    : `/books`;

  return (
    <section
      className="my-10 relative select-none group"
      onMouseEnter={() => setIsRowHovered(true)}
      onMouseLeave={() => setIsRowHovered(false)}
    >
      {/* Row Header */}
      <div className="flex items-center justify-between mb-2 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2">
          <span className="text-[#8B5E3C] font-mono text-sm">—</span>
          <h3 className="font-serif text-xl sm:text-2xl font-medium text-[#3B2A1E]">
            {title}
          </h3>
        </div>

        {genreSlug && (
          <Link
            href={seeAllHref}
            className="flex items-center gap-1 text-xs sm:text-sm text-[#7A6552] hover:text-[#B4532A] transition-colors"
          >
            <span>See all</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        )}
      </div>

      {/* Row Scroll Viewport & Shelves */}
      <div className="relative px-2 sm:px-4">
        {/* Left Arrow Button */}
        <button
          onClick={() => scroll("left")}
          disabled={!canScrollLeft}
          aria-label="Scroll row left"
          className={`absolute left-2 sm:left-4 top-1/2 -translate-y-8 z-30 w-10 h-10 rounded-full bg-[#FFFDF7]/95 border border-[#E6D9C3] shadow-warm flex items-center justify-center text-[#3B2A1E] transition-all duration-200 ${
            isRowHovered && canScrollLeft
              ? "opacity-100 scale-100"
              : "opacity-0 scale-90 pointer-events-none"
          } hover:bg-[#FAF4E8] hover:border-[#8B5E3C]`}
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        {/* Right Arrow Button */}
        <button
          onClick={() => scroll("right")}
          disabled={!canScrollRight}
          aria-label="Scroll row right"
          className={`absolute right-2 sm:right-4 top-1/2 -translate-y-8 z-30 w-10 h-10 rounded-full bg-[#FFFDF7]/95 border border-[#E6D9C3] shadow-warm flex items-center justify-center text-[#3B2A1E] transition-all duration-200 ${
            isRowHovered && canScrollRight
              ? "opacity-100 scale-100"
              : "opacity-0 scale-90 pointer-events-none"
          } hover:bg-[#FAF4E8] hover:border-[#8B5E3C]`}
        >
          <ChevronRight className="w-5 h-5" />
        </button>

        {/* Spines Container */}
        <div
          ref={scrollContainerRef}
          className="flex items-end gap-1.5 sm:gap-2 px-4 sm:px-6 overflow-x-auto no-scrollbar scroll-smooth pt-6 pb-0"
          style={{ scrollSnapType: "x proximity" }}
        >
          {books.map((book, index) => (
            <div key={book.id} style={{ scrollSnapAlign: "start" }}>
              <BookSpine
                book={book}
                index={index}
                hoveredIndex={hoveredIndex}
                onHover={setHoveredIndex}
                onClick={onSelectBook}
                onEdit={onEditBook}
                onDelete={onDeleteBook}
                isAdminOrLibrarian={isAdminOrLibrarian}
              />
            </div>
          ))}
        </div>

        {/* Wooden Shelf Plank */}
        <div className="w-full relative z-20">
          {/* Plank Top Surface */}
          <div className="w-full h-3 sm:h-3.5 wood-plank-top rounded-t-sm" />
          {/* Plank Front Edge */}
          <div className="w-full h-2.5 sm:h-3 wood-plank-edge rounded-b-sm shadow-shelf" />
        </div>
      </div>
    </section>
  );
}
