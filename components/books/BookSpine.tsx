"use client";

import React, { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Book } from "@/types";
import { getSpineProperties } from "@/lib/utils";
import { Edit2, Trash2 } from "lucide-react";

interface BookSpineProps {
  book: Book;
  index: number;
  hoveredIndex: number | null;
  onHover: (index: number | null) => void;
  onClick: (book: Book) => void;
  onEdit?: (book: Book) => void;
  onDelete?: (book: Book) => void;
  isAdminOrLibrarian?: boolean;
}

export function BookSpine({
  book,
  index,
  hoveredIndex,
  onHover,
  onClick,
  onEdit,
  onDelete,
  isAdminOrLibrarian,
}: BookSpineProps) {
  const shouldReduceMotion = useReducedMotion();
  const { width, height, color } = getSpineProperties(book.id);
  const [isHovered, setIsHovered] = useState(false);

  // Calculate neighbour displacement based on hovered index
  let neighbourX = 0;
  if (!shouldReduceMotion && hoveredIndex !== null && hoveredIndex !== index) {
    const diff = index - hoveredIndex;
    if (diff === -1) neighbourX = -10;
    else if (diff === -2) neighbourX = -5;
    else if (diff === 1) neighbourX = 10;
    else if (diff === 2) neighbourX = 5;
  }

  return (
    <div
      className="relative flex items-end justify-center select-none cursor-pointer flex-shrink-0"
      style={{ width: `${width + 4}px`, height: "250px" }}
      onMouseEnter={() => {
        setIsHovered(true);
        onHover(index);
      }}
      onMouseLeave={() => {
        setIsHovered(false);
        onHover(null);
      }}
      onClick={() => onClick(book)}
    >
      <motion.div
        layoutId={`book-spine-${book.id}`}
        animate={{
          x: neighbourX,
          y: isHovered && !shouldReduceMotion ? -14 : 0,
          scale: isHovered && !shouldReduceMotion ? 1.06 : 1,
          zIndex: isHovered ? 30 : 10,
        }}
        transition={{
          type: "spring",
          stiffness: 300,
          damping: 22,
        }}
        style={{
          width: `${width}px`,
          height: `${height}px`,
          backgroundColor: color.bg,
          color: color.text,
        }}
        className="relative rounded-t-[4px] rounded-b-[2px] shadow-spine hover:shadow-spine-hover transition-shadow overflow-hidden flex flex-col justify-between items-center py-2.5 px-1 border-l border-white/20 border-r border-black/20"
      >
        {/* Spine Texture Highlights */}
        <div className="absolute inset-y-0 left-0 w-[3px] bg-white/20" />
        <div className="absolute inset-y-0 right-0 w-[4px] bg-black/25" />
        <div className="absolute inset-0 bg-gradient-to-r from-white/10 via-transparent to-black/15 pointer-events-none" />

        {/* Top Gold Double Lines */}
        <div className="w-full flex flex-col items-center gap-[2px] z-10 shrink-0">
          <div
            className="w-[80%] h-[1.5px] rounded-full"
            style={{ backgroundColor: color.gold }}
          />
          <div
            className="w-[60%] h-[1px] opacity-75 rounded-full"
            style={{ backgroundColor: color.gold }}
          />
        </div>

        {/* Book Title (Vertical Serif Typography) */}
        <div className="flex-1 flex items-center justify-center my-2 overflow-hidden z-10 w-full">
          <span
            className="spine-title-vertical font-serif text-[11px] font-medium tracking-wider text-center max-h-[150px] truncate"
            style={{
              color: color.text,
              textShadow: "0 1px 2px rgba(0,0,0,0.4)",
            }}
          >
            {book.name}
          </span>
        </div>

        {/* Author / Bottom Gold Line */}
        <div className="w-full flex flex-col items-center gap-[2px] z-10 shrink-0">
          <div
            className="w-[60%] h-[1px] opacity-75 rounded-full"
            style={{ backgroundColor: color.gold }}
          />
          <div
            className="w-[80%] h-[1.5px] rounded-full"
            style={{ backgroundColor: color.gold }}
          />
          <span className="text-[8px] font-sans opacity-60 tracking-tighter truncate max-w-[90%] mt-0.5">
            {book.author.split(" ").slice(-1)[0]}
          </span>
        </div>

        {/* Admin Quick Action Icons on Spine Hover */}
        {isAdminOrLibrarian && isHovered && (
          <div
            className="absolute top-2 right-1 flex flex-col gap-1 z-40 bg-black/75 p-1 rounded backdrop-blur-xs"
            onClick={(e) => e.stopPropagation()}
          >
            {onEdit && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(book);
                }}
                title="Edit book"
                className="p-1 text-white hover:text-amber-300 transition-colors"
              >
                <Edit2 className="w-3 h-3" />
              </button>
            )}
            {onDelete && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(book);
                }}
                title="Delete book"
                className="p-1 text-white hover:text-red-400 transition-colors"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
}
