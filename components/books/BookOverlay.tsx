"use client";

import React, { useEffect, useState, useRef } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useBookStore } from "@/store/useBookStore";
import { useAuthStore } from "@/store/useAuthStore";
import { useReadingStore } from "@/store/useReadingStore";
import { useToast } from "@/components/ui/Toast";
import { getSpineProperties } from "@/lib/utils";
import {
  X,
  Heart,
  BookmarkPlus,
  BookOpen,
  Edit2,
  Trash2,
  Calendar,
  Layers,
  Sparkles,
  RotateCw,
} from "lucide-react";

export function BookOverlay() {
  const router = useRouter();
  const { toast, success } = useToast();
  const { user } = useAuthStore();
  const {
    selectedBook,
    isOverlayOpen,
    closeOverlay,
    openReader,
    likedBookIds,
    toggleLike,
    deleteBook,
  } = useBookStore();
  const { setStatus, getEntryForBook } = useReadingStore();

  const [isDesktop, setIsDesktop] = useState(true);
  const [isOpenBook, setIsOpenBook] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Screen size check
  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // When overlay opens on desktop, trigger the 3D book swing-open animation
  useEffect(() => {
    if (isOverlayOpen && selectedBook) {
      document.body.style.overflow = "hidden";
      if (isDesktop) {
        // Start closed for a moment so the user sees the 3D hardcover, then swing open!
        setIsOpenBook(false);
        const timer = setTimeout(() => {
          setIsOpenBook(true);
        }, 220);
        return () => clearTimeout(timer);
      } else {
        setIsOpenBook(true);
      }
    } else {
      document.body.style.overflow = "unset";
      setIsOpenBook(false);
      setConfirmDelete(false);
    }
  }, [isOverlayOpen, selectedBook, isDesktop]);

  // Keyboard shortcut: Escape to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOverlayOpen) {
        closeOverlay();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOverlayOpen, closeOverlay]);

  if (!isOverlayOpen || !selectedBook) return null;

  const isLiked = likedBookIds.has(selectedBook.id);
  const readingEntry = getEntryForBook(selectedBook.id);
  const isAdminOrLibrarian = user?.role === "admin" || user?.role === "librarian";
  const spineProps = getSpineProperties(selectedBook.id);

  const handleLikeClick = async () => {
    if (!user) {
      toast("Please log in to like this book.", "info");
      router.push("/login?redirect=" + encodeURIComponent(window.location.pathname));
      return;
    }
    await toggleLike(selectedBook.id);
  };

  const handleAddToWishlist = async () => {
    if (!user) {
      toast("Please log in to add books to your reading board.", "info");
      router.push("/login?redirect=" + encodeURIComponent(window.location.pathname));
      return;
    }
    const ok = await setStatus(user.id, selectedBook.id, "wishlist");
    if (ok) {
      success(`Added "${selectedBook.name}" to your Wishlist`);
    }
  };

  const handleStartReading = async () => {
    if (user) {
      await setStatus(user.id, selectedBook.id, "reading");
    }
    openReader(selectedBook);
  };

  const handleDelete = async () => {
    const ok = await deleteBook(selectedBook.id);
    if (ok) {
      success(`Deleted "${selectedBook.name}" from library`);
      setConfirmDelete(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 lg:p-10 select-none overflow-y-auto no-scrollbar">
        {/* Backdrop (Dark brown at 50% opacity, slight blur) */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          onClick={closeOverlay}
          className="fixed inset-0 bg-[#3B2A1E]/55 backdrop-blur-sm"
        />

        {/* ============================================================
            DESKTOP VERSION B: REAL 3D BOOK OPENING ANIMATION
            Spine comes forward, turns face-on, and front hardcover
            swings open 165° to reveal the inside spreads!
            ============================================================ */}
        {isDesktop ? (
          <div
            className="relative z-10 w-full max-w-4xl"
            style={{ perspective: "1600px" }}
          >
            {/* The 3D Book Object */}
            <motion.div
              initial={{ scale: 0.8, y: 40, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.8, y: 40, opacity: 0 }}
              transition={{ type: "spring", stiffness: 260, damping: 24 }}
              className="relative mx-auto rounded-r-xl rounded-l-md shadow-2xl"
              style={{
                width: "840px",
                height: "530px",
                transformStyle: "preserve-3d",
              }}
            >
              {/* BACK COVER & PAGES BLOCK (The Inside Spreads) */}
              <div
                className="absolute inset-0 grid grid-cols-2 bg-[#FFFDF7] rounded-r-xl rounded-l-md border border-[#E6D9C3] overflow-hidden shadow-2xl"
                style={{
                  boxShadow:
                    "0 25px 50px -12px rgba(40, 20, 10, 0.45), 0 0 0 1px rgba(230, 217, 195, 0.7)",
                }}
              >
                {/* ----------------------------------------------------
                    LEFT SPREAD: FRONTISPIECE & BOOKPLATE
                    ---------------------------------------------------- */}
                <div className="bg-[#FAF4E8] p-8 flex flex-col items-center justify-between border-r border-[#E6D9C3] relative">
                  {/* Subtle paper gutter shadow */}
                  <div className="absolute right-0 inset-y-0 w-8 bg-gradient-to-l from-black/15 to-transparent pointer-events-none" />

                  {/* Header stamp */}
                  <div className="text-[10px] uppercase tracking-widest text-[#7A6552] font-mono border-b border-[#E6D9C3] pb-1 w-full text-center">
                    Ex Libris · Shabdkunj Library
                  </div>

                  {/* Book Cover Frame inside left page */}
                  <div className="relative w-52 h-72 rounded-md shadow-md overflow-hidden border-2 border-[#8B5E3C]/20 bg-[#FFFDF7] p-1 my-auto">
                    <div className="relative w-full h-full rounded overflow-hidden">
                      <Image
                        src={selectedBook.coverImage}
                        alt={selectedBook.name}
                        fill
                        priority
                        className="object-cover"
                      />
                    </div>
                  </div>

                  {/* Footer metadata */}
                  <div className="flex items-center gap-4 text-[11px] text-[#7A6552]">
                    {selectedBook.pages && (
                      <span className="flex items-center gap-1">
                        <Layers className="w-3.5 h-3.5" />
                        {selectedBook.pages} pages
                      </span>
                    )}
                    {selectedBook.publishYear && (
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        First published {selectedBook.publishYear}
                      </span>
                    )}
                  </div>
                </div>

                {/* ----------------------------------------------------
                    RIGHT SPREAD: PARCHMENT DETAILS & CONTROLS
                    ---------------------------------------------------- */}
                <div className="p-8 sm:p-9 flex flex-col justify-between bg-[#FFFDF7] relative">
                  {/* Subtle paper gutter shadow */}
                  <div className="absolute left-0 inset-y-0 w-8 bg-gradient-to-r from-black/15 to-transparent pointer-events-none" />

                  {/* Close 'X' Button on top right */}
                  <button
                    onClick={closeOverlay}
                    className="absolute top-4 right-4 z-40 w-8 h-8 rounded-full bg-[#FAF4E8] hover:bg-[#E6D9C3] text-[#3B2A1E] flex items-center justify-center transition-colors shadow-xs"
                    aria-label="Close book"
                  >
                    <X className="w-4 h-4" />
                  </button>

                  <div>
                    {/* Genre pill & Likes count */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className="px-3 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#FAF4E8] text-[#B4532A] border border-[#E6D9C3]">
                        {selectedBook.genre}
                      </span>

                      <div className="flex items-center gap-1.5 text-xs text-[#7A6552] mr-8">
                        <Heart
                          className={`w-4 h-4 ${
                            isLiked ? "fill-[#B4532A] text-[#B4532A]" : ""
                          }`}
                        />
                        <span className="font-semibold text-[#3B2A1E]">
                          {selectedBook.likesCount}
                        </span>
                        <span>likes</span>
                      </div>
                    </div>

                    {/* Book Name & Author */}
                    <h2 className="font-serif text-2xl sm:text-3xl font-medium text-[#3B2A1E] leading-snug mb-1">
                      {selectedBook.name}
                    </h2>
                    <div className="text-xs font-semibold text-[#7A6552] uppercase tracking-wide mb-4">
                      by <span className="text-[#3B2A1E]">{selectedBook.author}</span>
                    </div>

                    {/* Description */}
                    <p className="text-xs sm:text-sm text-[#3B2A1E]/85 leading-relaxed font-normal line-clamp-6 mb-4">
                      {selectedBook.description}
                    </p>
                  </div>

                  {/* Actions & Buttons */}
                  <div>
                    <div className="flex items-center gap-2.5 pt-4 border-t border-[#E6D9C3]">
                      {/* Like button */}
                      <button
                        onClick={handleLikeClick}
                        className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-semibold transition-all ${
                          isLiked
                            ? "bg-rose-50 border border-rose-200 text-rose-700"
                            : "bg-[#FAF4E8] border border-[#E6D9C3] text-[#3B2A1E] hover:border-[#8B5E3C]"
                        }`}
                      >
                        <Heart
                          className={`w-3.5 h-3.5 ${
                            isLiked ? "fill-[#B4532A] text-[#B4532A]" : ""
                          }`}
                        />
                        <span>{isLiked ? "Liked" : "Like"}</span>
                      </button>

                      {/* Add to Wishlist */}
                      <button
                        onClick={handleAddToWishlist}
                        className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-semibold transition-all ${
                          readingEntry?.status === "wishlist"
                            ? "bg-[#8B5E3C]/10 border border-[#8B5E3C] text-[#8B5E3C]"
                            : "bg-[#FAF4E8] border border-[#E6D9C3] text-[#3B2A1E] hover:border-[#8B5E3C]"
                        }`}
                      >
                        <BookmarkPlus className="w-3.5 h-3.5" />
                        <span>
                          {readingEntry?.status === "wishlist"
                            ? "In Wishlist"
                            : "Add to Wishlist"}
                        </span>
                      </button>

                      {/* Start Reading */}
                      <button
                        onClick={handleStartReading}
                        className="flex-1 flex items-center justify-center gap-2 px-5 py-2 rounded-full bg-[#B4532A] hover:bg-[#8F3F1C] text-[#FAF4E8] text-xs font-semibold uppercase tracking-wider transition-all shadow-sm"
                      >
                        <BookOpen className="w-4 h-4" />
                        <span>Start Reading</span>
                      </button>
                    </div>

                    {/* Admin/Librarian Tools */}
                    {isAdminOrLibrarian && (
                      <div className="mt-3 pt-2 border-t border-[#E6D9C3]/60 flex items-center justify-between text-[11px] text-[#7A6552]">
                        <span className="font-semibold uppercase tracking-wider text-[10px]">
                          Librarian Tools:
                        </span>
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => {
                              closeOverlay();
                              router.push(`/admin/books/${selectedBook.id}/edit`);
                            }}
                            className="flex items-center gap-1 hover:text-[#B4532A] transition-colors"
                          >
                            <Edit2 className="w-3 h-3" />
                            <span>Edit</span>
                          </button>

                          {confirmDelete ? (
                            <div className="flex items-center gap-2 bg-red-50 px-2 py-0.5 rounded border border-red-200">
                              <span className="text-red-700">Delete?</span>
                              <button
                                onClick={handleDelete}
                                className="text-red-700 font-bold hover:underline"
                              >
                                Yes
                              </button>
                              <button
                                onClick={() => setConfirmDelete(false)}
                                className="text-stone-500 hover:underline"
                              >
                                No
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setConfirmDelete(true)}
                              className="flex items-center gap-1 hover:text-red-600 transition-colors"
                            >
                              <Trash2 className="w-3 h-3" />
                              <span>Delete</span>
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* ========================================================
                  THE SWINGING FRONT HARDCOVER
                  Swings open from rotateY(0deg) to rotateY(-165deg)!
                  ======================================================== */}
              <motion.div
                animate={{
                  rotateY: isOpenBook ? -165 : 0,
                }}
                transition={{
                  type: "spring",
                  stiffness: 90,
                  damping: 15,
                  mass: 1.2,
                }}
                style={{
                  position: "absolute",
                  left: 0,
                  top: 0,
                  width: "50%",
                  height: "100%",
                  transformOrigin: "left center",
                  transformStyle: "preserve-3d",
                  zIndex: 30,
                }}
                className="rounded-l-md rounded-r-sm cursor-pointer shadow-2xl"
              >
                {/* 1. FRONT FACE OF HARDCOVER (Visible when closed) */}
                <div
                  className="absolute inset-0 rounded-l-md rounded-r-sm overflow-hidden backface-hidden flex flex-col justify-between p-8 border-r-4 border-[#3B2A1E]"
                  style={{
                    backgroundColor: spineProps.color.bg,
                    color: spineProps.color.text,
                    boxShadow: "inset 4px 0 12px rgba(0,0,0,0.4)",
                  }}
                >
                  {/* Decorative vintage frame */}
                  <div
                    className="absolute inset-4 rounded border-2 opacity-60 pointer-events-none"
                    style={{ borderColor: spineProps.color.gold }}
                  />
                  <div
                    className="absolute inset-6 rounded border opacity-40 pointer-events-none"
                    style={{ borderColor: spineProps.color.gold }}
                  />

                  {/* Top stamp */}
                  <div className="text-center z-10">
                    <span
                      className="text-[10px] uppercase font-bold tracking-widest"
                      style={{ color: spineProps.color.gold }}
                    >
                      SHABDKUNJ LIBRARY EDITION
                    </span>
                  </div>

                  {/* Middle Title & Author */}
                  <div className="text-center z-10 px-4 my-auto">
                    <h2
                      className="font-serif text-2xl sm:text-3xl font-medium tracking-tight leading-tight mb-2"
                      style={{ color: spineProps.color.text }}
                    >
                      {selectedBook.name}
                    </h2>
                    <p
                      className="text-xs uppercase tracking-wider font-sans opacity-80"
                      style={{ color: spineProps.color.gold }}
                    >
                      {selectedBook.author}
                    </p>
                  </div>

                  {/* Bottom ornament */}
                  <div className="text-center z-10">
                    <span
                      className="text-xs opacity-75 font-serif"
                      style={{ color: spineProps.color.gold }}
                    >
                      ✦ ✦ ✦
                    </span>
                  </div>
                </div>

                {/* 2. BACK FACE OF HARDCOVER (Inside front cover, revealed when open) */}
                <div
                  className="absolute inset-0 rounded-r-md rounded-l-sm bg-[#F4EBD9] p-8 border-l border-[#E6D9C3] flex flex-col justify-between overflow-hidden"
                  style={{
                    transform: "rotateY(180deg)",
                    backfaceVisibility: "hidden",
                    WebkitBackfaceVisibility: "hidden",
                  }}
                >
                  <div className="text-[10px] uppercase tracking-widest text-[#7A6552] font-mono text-center border-b border-[#E6D9C3] pb-1">
                    Front Cover Flap
                  </div>
                  <div className="text-center my-auto p-4 border border-dashed border-[#8B5E3C]/30 rounded-lg">
                    <p className="font-serif italic text-sm text-[#3B2A1E]">
                      &ldquo;A room without books is like a body without a soul.&rdquo;
                    </p>
                    <span className="text-[10px] text-[#7A6552] uppercase tracking-wider mt-2 block font-sans">
                      — Cicero
                    </span>
                  </div>
                  <div className="text-[10px] text-center text-[#7A6552]">
                    Shabdkunj Sanctuary
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        ) : (
          /* ============================================================
             MOBILE VERSION A: SHARED ELEMENT DIALOG CARD
             ============================================================ */
          <motion.div
            layoutId={`book-spine-${selectedBook.id}`}
            className="relative z-10 w-full max-w-sm bg-[#FFFDF7] rounded-2xl border border-[#E6D9C3] shadow-warm-lg p-5 overflow-hidden"
          >
            {/* Close Button */}
            <button
              onClick={closeOverlay}
              className="absolute top-3 right-3 z-40 w-8 h-8 rounded-full bg-[#FAF4E8] text-[#3B2A1E] flex items-center justify-center"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex flex-col items-center text-center">
              <div className="relative w-36 h-52 rounded-md shadow-md overflow-hidden mb-4">
                <Image
                  src={selectedBook.coverImage}
                  alt={selectedBook.name}
                  fill
                  className="object-cover"
                />
              </div>

              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#FAF4E8] text-[#B4532A] border border-[#E6D9C3] mb-1.5">
                {selectedBook.genre}
              </span>
              <h2 className="font-serif text-xl font-medium text-[#3B2A1E]">
                {selectedBook.name}
              </h2>
              <div className="text-xs text-[#7A6552] mb-3">
                by {selectedBook.author}
              </div>
              <p className="text-xs text-[#3B2A1E]/80 leading-relaxed mb-4 line-clamp-3">
                {selectedBook.description}
              </p>

              {/* Action Buttons */}
              <div className="w-full flex flex-col gap-2 pt-2 border-t border-[#E6D9C3]">
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleLikeClick}
                    className="flex-1 py-2 rounded-full border border-[#E6D9C3] bg-[#FAF4E8] text-xs font-semibold flex items-center justify-center gap-1.5"
                  >
                    <Heart
                      className={`w-3.5 h-3.5 ${
                        isLiked ? "fill-[#B4532A] text-[#B4532A]" : ""
                      }`}
                    />
                    <span>{selectedBook.likesCount} Likes</span>
                  </button>

                  <button
                    onClick={handleAddToWishlist}
                    className="flex-1 py-2 rounded-full border border-[#E6D9C3] bg-[#FAF4E8] text-xs font-semibold flex items-center justify-center gap-1.5"
                  >
                    <BookmarkPlus className="w-3.5 h-3.5" />
                    <span>Wishlist</span>
                  </button>
                </div>

                <button
                  onClick={handleStartReading}
                  className="w-full py-2.5 rounded-full bg-[#B4532A] text-white text-xs font-semibold uppercase tracking-wider flex items-center justify-center gap-2 shadow-sm"
                >
                  <BookOpen className="w-4 h-4" />
                  <span>Start Reading</span>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </AnimatePresence>
  );
}
