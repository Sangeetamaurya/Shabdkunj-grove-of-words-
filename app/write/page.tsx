"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import { useToast } from "@/components/ui/Toast";
import * as api from "@/lib/api";
import {
  ArrowLeft,
  Image as ImageIcon,
  ChevronDown,
  Bold,
  Italic,
  Heading1,
  Quote,
  Minus,
  Link2,
  X,
  Upload,
} from "lucide-react";

const CATEGORIES = [
  "Reading Life",
  "Culture",
  "Ideas",
  "Reviews",
  "Essays",
  "Philosophy",
];

export default function WritePage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { toast, success, error } = useToast();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [imageUrl, setImageUrl] = useState("");
  const [showImageModal, setShowImageModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Route protection
  useEffect(() => {
    if (!user) {
      toast("Please log in to write an essay.", "info");
      router.push("/login?redirect=/write");
    }
  }, [user, router, toast]);

  if (!user) return null;

  // Insert markdown helper into textarea
  const insertFormatting = (prefix: string, suffix: string = "") => {
    const el = textareaRef.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const text = el.value;
    const selected = text.substring(start, end) || "text";
    const replacement = `${prefix}${selected}${suffix}`;
    setContent(text.substring(0, start) + replacement + text.substring(end));
    setTimeout(() => {
      el.focus();
      el.setSelectionRange(start + prefix.length, start + prefix.length + selected.length);
    }, 50);
  };

  const handleSave = async (status: "draft" | "published") => {
    if (!title.trim()) {
      error("Please enter a title for your story.");
      return;
    }
    if (status === "published" && !content.trim()) {
      error("Story content cannot be empty.");
      return;
    }

    setIsSaving(true);
    try {
      const article = await api.createArticle(
        {
          title: title.trim(),
          subtitle: content.substring(0, 140) + "...",
          content: content.trim(),
          category,
          status,
          image: imageUrl || undefined,
        },
        user
      );

      if (status === "published") {
        success("Your story has been published!");
        router.push(`/articles/${article.id}`);
      } else {
        success("Draft saved successfully");
        router.push("/profile");
      }
    } catch (err: any) {
      error(err.message || "Failed to save story");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF4E8] text-[#3B2A1E] py-8 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto">
        {/* Top Action Bar (Matching 05-write-editor.jpg) */}
        <div className="flex items-center justify-between mb-8">
          <Link
            href="/articles"
            className="inline-flex items-center gap-2 text-xs font-medium text-[#7A6552] hover:text-[#3B2A1E] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Exit editor</span>
          </Link>

          <div className="flex items-center gap-3">
            <button
              onClick={() => handleSave("draft")}
              disabled={isSaving}
              className="px-4 py-2 rounded-lg bg-[#FFFDF7] hover:bg-[#FAF4E8] border border-[#E6D9C3] text-xs font-semibold text-[#3B2A1E] transition-colors shadow-xs"
            >
              Save draft
            </button>
            <button
              onClick={() => handleSave("published")}
              disabled={isSaving}
              className="px-5 py-2 rounded-lg bg-[#182631] hover:bg-[#2A4154] text-xs font-semibold text-[#FAF4E8] transition-colors shadow-xs"
            >
              {isSaving ? "Publishing..." : "Publish"}
            </button>
          </div>
        </div>

        {/* Paper Canvas */}
        <div className="bg-[#FFFDF7] rounded-xl border border-[#E6D9C3] shadow-warm-md p-6 sm:p-12 min-h-[640px]">
          <span className="text-[10px] uppercase font-bold tracking-widest text-[#B4532A] mb-3 block">
            NEW STORY
          </span>

          {/* Title Input */}
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title of your story"
            className="w-full bg-transparent font-serif text-3xl sm:text-5xl font-medium text-[#3B2A1E] placeholder:text-[#A48F7B]/50 focus:outline-none mb-6 border-b border-[#E6D9C3]/50 pb-4"
          />

          {/* Controls: Cover Image & Category Dropdown */}
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 mb-4 border-b border-[#E6D9C3]/60 text-xs text-[#7A6552]">
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => setShowImageModal(!showImageModal)}
                className="flex items-center gap-1.5 hover:text-[#B4532A] transition-colors"
              >
                <ImageIcon className="w-4 h-4 text-[#8B5E3C]" />
                <span>{imageUrl ? "Change cover image" : "+ Add cover image"}</span>
              </button>
              {imageUrl && (
                <button
                  onClick={() => setImageUrl("")}
                  className="text-red-500 hover:underline text-[11px]"
                >
                  Remove
                </button>
              )}
            </div>

            {/* Category dropdown */}
            <div className="relative flex items-center gap-1">
              <span>Category:</span>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="bg-[#FAF4E8] border border-[#E6D9C3] rounded-md px-2.5 py-1 text-xs text-[#3B2A1E] font-medium focus:outline-none focus:border-[#8B5E3C]"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Cover image preview if selected */}
          {imageUrl && (
            <div className="relative aspect-[16/7] rounded-lg overflow-hidden mb-6 border border-[#E6D9C3]">
              <Image src={imageUrl} alt="Cover preview" fill className="object-cover" />
            </div>
          )}

          {/* Formatting Toolbar */}
          <div className="flex items-center gap-1 sm:gap-2 pb-3 mb-6 border-b border-[#E6D9C3]/40 text-[#7A6552]">
            <button
              type="button"
              onClick={() => insertFormatting("**", "**")}
              className="p-1.5 rounded hover:bg-[#FAF4E8] hover:text-[#3B2A1E] transition-colors"
              title="Bold"
            >
              <Bold className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => insertFormatting("*", "*")}
              className="p-1.5 rounded hover:bg-[#FAF4E8] hover:text-[#3B2A1E] transition-colors"
              title="Italic"
            >
              <Italic className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => insertFormatting("## ")}
              className="p-1.5 rounded hover:bg-[#FAF4E8] hover:text-[#3B2A1E] transition-colors"
              title="Heading"
            >
              <Heading1 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => insertFormatting("> ")}
              className="p-1.5 rounded hover:bg-[#FAF4E8] hover:text-[#3B2A1E] transition-colors"
              title="Quote"
            >
              <Quote className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => insertFormatting("\n\n---\n\n")}
              className="p-1.5 rounded hover:bg-[#FAF4E8] hover:text-[#3B2A1E] transition-colors"
              title="Divider"
            >
              <Minus className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => insertFormatting("[link text](", ")")}
              className="p-1.5 rounded hover:bg-[#FAF4E8] hover:text-[#3B2A1E] transition-colors"
              title="Link"
            >
              <Link2 className="w-4 h-4" />
            </button>
          </div>

          {/* Content Textarea */}
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Tell your story..."
            rows={16}
            className="w-full bg-transparent resize-none font-serif text-base sm:text-lg leading-relaxed text-[#3B2A1E] placeholder:text-[#A48F7B]/50 focus:outline-none"
          />
        </div>
      </div>

      {/* Image URL Picker Modal */}
      {showImageModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-[#FFFDF7] p-6 rounded-xl border border-[#E6D9C3] shadow-warm-lg max-w-md w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-serif text-lg font-medium">Add Cover Image</h3>
              <button onClick={() => setShowImageModal(false)}>
                <X className="w-4 h-4 text-stone-500" />
              </button>
            </div>
            <p className="text-xs text-[#7A6552] mb-4">
              Enter an image URL from Unsplash or upload a placeholder.
            </p>
            <input
              type="url"
              placeholder="https://images.unsplash.com/..."
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              className="w-full p-2 text-xs bg-[#FAF4E8] border border-[#E6D9C3] rounded mb-4 focus:outline-none focus:border-[#8B5E3C]"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setImageUrl(
                    "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=800&auto=format&fit=crop&q=80"
                  );
                  setShowImageModal(false);
                }}
                className="px-3 py-1.5 text-xs text-[#B4532A] hover:underline"
              >
                Use Cozy Library Sample
              </button>
              <button
                onClick={() => setShowImageModal(false)}
                className="px-4 py-1.5 rounded bg-[#182631] text-white text-xs font-medium"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
