"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import { useToast } from "@/components/ui/Toast";
import * as api from "@/lib/api";
import {
  ArrowLeft,
  Image as ImageIcon,
  Bold,
  Italic,
  Heading1,
  Quote,
  Minus,
  Link2,
  X,
} from "lucide-react";

const CATEGORIES = [
  "Reading Life",
  "Culture",
  "Ideas",
  "Reviews",
  "Essays",
  "Philosophy",
];

export default function EditArticlePage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const { user } = useAuthStore();
  const { toast, success, error } = useToast();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [imageUrl, setImageUrl] = useState("");
  const [status, setStatus] = useState<"draft" | "published">("published");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    async function loadArticle() {
      setIsLoading(true);
      const article = await api.getArticle(id);
      if (article) {
        setTitle(article.title);
        setContent(article.content);
        setCategory(article.category);
        setImageUrl(article.image || "");
        setStatus(article.status);
      }
      setIsLoading(false);
    }
    loadArticle();
  }, [id]);

  // Route protection
  useEffect(() => {
    if (!user) {
      toast("Please log in to edit.", "info");
      router.push(`/login?redirect=/write/${id}`);
    }
  }, [user, router, toast, id]);

  if (!user || isLoading) {
    return (
      <div className="max-w-4xl mx-auto py-20 px-4 animate-pulse">
        <div className="h-10 bg-[#E6D9C3] rounded w-2/3 mb-4" />
        <div className="h-64 bg-[#E6D9C3] rounded w-full" />
      </div>
    );
  }

  const handleUpdate = async (newStatus: "draft" | "published") => {
    if (!title.trim()) {
      error("Please enter a title.");
      return;
    }

    setIsSaving(true);
    try {
      await api.updateArticle(
        id,
        {
          title: title.trim(),
          subtitle: content.substring(0, 140) + "...",
          content: content.trim(),
          category,
          status: newStatus,
          image: imageUrl || undefined,
        },
        user
      );

      success("Story updated successfully!");
      if (newStatus === "published") {
        router.push(`/articles/${id}`);
      } else {
        router.push("/profile");
      }
    } catch (err: any) {
      error(err.message || "Failed to update story");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF4E8] text-[#3B2A1E] py-8 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto">
        {/* Top Action Bar */}
        <div className="flex items-center justify-between mb-8">
          <Link
            href="/profile"
            className="inline-flex items-center gap-2 text-xs font-medium text-[#7A6552] hover:text-[#3B2A1E] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to profile</span>
          </Link>

          <div className="flex items-center gap-3">
            <button
              onClick={() => handleUpdate("draft")}
              disabled={isSaving}
              className="px-4 py-2 rounded-lg bg-[#FFFDF7] hover:bg-[#FAF4E8] border border-[#E6D9C3] text-xs font-semibold text-[#3B2A1E] transition-colors shadow-xs"
            >
              Save as draft
            </button>
            <button
              onClick={() => handleUpdate("published")}
              disabled={isSaving}
              className="px-5 py-2 rounded-lg bg-[#182631] hover:bg-[#2A4154] text-xs font-semibold text-[#FAF4E8] transition-colors shadow-xs"
            >
              {isSaving ? "Saving..." : "Update Story"}
            </button>
          </div>
        </div>

        {/* Paper Canvas */}
        <div className="bg-[#FFFDF7] rounded-xl border border-[#E6D9C3] shadow-warm-md p-6 sm:p-12 min-h-[640px]">
          <span className="text-[10px] uppercase font-bold tracking-widest text-[#B4532A] mb-3 block">
            EDIT STORY
          </span>

          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title of your story"
            className="w-full bg-transparent font-serif text-3xl sm:text-5xl font-medium text-[#3B2A1E] placeholder:text-[#A48F7B]/50 focus:outline-none mb-6 border-b border-[#E6D9C3]/50 pb-4"
          />

          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 mb-4 border-b border-[#E6D9C3]/60 text-xs text-[#7A6552]">
            <div className="flex items-center gap-4">
              <input
                type="text"
                placeholder="Cover image URL..."
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                className="p-1 px-2.5 text-xs bg-[#FAF4E8] border border-[#E6D9C3] rounded w-60"
              />
            </div>

            <div className="flex items-center gap-1">
              <span>Category:</span>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="bg-[#FAF4E8] border border-[#E6D9C3] rounded-md px-2.5 py-1 text-xs text-[#3B2A1E] font-medium focus:outline-none"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

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
    </div>
  );
}
