"use client";

import React from "react";
import Link from "next/link";
import { RoleSwitcher } from "@/components/ui/RoleSwitcher";
import { ArrowRight, BookOpen, Heart } from "lucide-react";

export function Footer() {
  return (
    <>
      <footer className="bg-[#182631] text-[#FAF4E8] mt-24">
        {/* Banner CTA section */}
        <div className="max-w-4xl mx-auto px-4 py-16 sm:py-20 text-center">
          <div className="text-[11px] uppercase tracking-widest text-amber-200/80 font-medium mb-3">
            O A S I S
          </div>
          <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-normal leading-tight tracking-tight mb-4">
            Come for a book.
            <br />
            <span className="italic font-normal text-[#E2C37E]">
              Stay for the conversation.
            </span>
          </h2>
          <p className="text-stone-300 text-sm max-w-lg mx-auto mb-8 font-light">
            A serene sanctuary where timeless literature meets intimate reflections,
            built for thoughtful readers and passionate writers.
          </p>
          <Link
            href="/books"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#B4532A] hover:bg-[#8F3F1C] text-[#FAF4E8] text-sm font-medium transition-all shadow-md hover:gap-3"
          >
            <span>Start exploring</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Divider */}
        <div className="border-t border-stone-700/60" />

        {/* Bottom links */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-stone-400">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded bg-[#FAF4E8] text-[#182631] flex items-center justify-center font-serif font-bold text-xs">
              श
            </div>
            <span>© {new Date().getFullYear()} Shabdkunj. All stories reserved.</span>
          </div>

          <div className="flex items-center gap-6">
            <Link href="/books" className="hover:text-[#FAF4E8] transition-colors">
              The Library
            </Link>
            <Link href="/articles" className="hover:text-[#FAF4E8] transition-colors">
              The Journal
            </Link>
            <Link href="/profile" className="hover:text-[#FAF4E8] transition-colors">
              Reading Board
            </Link>
          </div>

          <div className="flex items-center gap-1 text-[11px]">
            <span>Crafted with</span>
            <Heart className="w-3 h-3 text-[#B4532A] fill-[#B4532A]" />
            <span>for book lovers</span>
          </div>
        </div>
      </footer>

      {/* Floating Demo Role Switcher */}
      <RoleSwitcher />
    </>
  );
}
