"use client";

import React, { useEffect, useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Article, ArticleCategory } from "@/types";
import { useArticleStore } from "@/store/useArticleStore";
import { useAuthStore } from "@/store/useAuthStore";
import * as api from "@/lib/api";
import { Heart, MessageSquare, BookOpen, Clock, Search } from "lucide-react";

const CATEGORIES = ["All", "Reading Life", "Culture", "Ideas", "Reviews"];
type SortTab = "latest" | "top" | "trending";

export default function ArticlesPage() {
  const { user } = useAuthStore();
  const { toggleLike, likedArticleIds } = useArticleStore();

  const [articles, setArticles] = useState<Article[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [activeSort, setActiveSort] = useState<SortTab>("latest");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadArticles() {
      setIsLoading(true);
      const data = await api.getArticles({
        category: selectedCategory === "All" ? undefined : selectedCategory,
        sort: activeSort,
        search: searchQuery,
      });
      setArticles(data);
      setIsLoading(false);
    }
    loadArticles();
  }, [selectedCategory, activeSort, searchQuery]);

  return (
    <div className="min-h-screen bg-[#FAF4E8] text-[#3B2A1E] py-12 px-4 sm:px-6">
      <div className="max-w-[760px] mx-auto">
        {/* ============================================================
            1. HEADER (Matching 03-articles-feed.jpg)
            ============================================================ */}
        <div className="text-center mb-12">
          <span className="text-xs uppercase tracking-widest text-[#B4532A] font-semibold">
            ESSAYS & IDEAS
          </span>
          <h1 className="font-serif text-3xl sm:text-5xl font-medium tracking-tight text-[#3B2A1E] mt-2 mb-3">
            From the reading room
          </h1>
          <p className="text-sm text-[#7A6552] max-w-md mx-auto leading-relaxed">
            Fresh perspectives on books, culture, and a more thoughtful way of living.
          </p>
        </div>

        {/* ============================================================
            2. CATEGORY CHIPS & SORT TABS (Matching 03-articles-feed.jpg)
            ============================================================ */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E6D9C3] mb-8">
          {/* Category Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
            {CATEGORIES.map((cat) => {
              const isActive = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors whitespace-nowrap ${
                    isActive
                      ? "bg-[#182631] text-[#FAF4E8]"
                      : "text-[#7A6552] hover:text-[#3B2A1E] hover:bg-[#FFFDF7]"
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>

          {/* Sort Tabs */}
          <div className="flex items-center gap-4 text-xs font-medium text-[#7A6552] shrink-0 self-end sm:self-auto">
            {(["latest", "top", "trending"] as SortTab[]).map((tab) => {
              const isActive = activeSort === tab;
              return (
                <button
                  key={tab}
                  onClick={() => setActiveSort(tab)}
                  className={`capitalize transition-colors ${
                    isActive
                      ? "text-[#3B2A1E] font-semibold border-b border-[#B4532A]"
                      : "hover:text-[#3B2A1E]"
                  }`}
                >
                  {tab}
                </button>
              );
            })}
          </div>
        </div>

        {/* ============================================================
            3. SUBSTACK-STYLE ARTICLE LIST
            ============================================================ */}
        {isLoading ? (
          <div className="space-y-8">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="animate-pulse space-y-3 pb-8 border-b border-[#E6D9C3]">
                <div className="h-3 bg-[#E6D9C3] rounded w-20" />
                <div className="h-6 bg-[#E6D9C3] rounded w-3/4" />
                <div className="h-4 bg-[#E6D9C3] rounded w-full" />
                <div className="h-3 bg-[#E6D9C3] rounded w-1/3" />
              </div>
            ))}
          </div>
        ) : articles.length > 0 ? (
          <motion.div layout className="divide-y divide-[#E6D9C3]">
            <AnimatePresence mode="popLayout">
              {articles.map((article) => {
                const isLiked = likedArticleIds.has(article.id);
                return (
                  <motion.article
                    key={article.id}
                    layout
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    transition={{ duration: 0.2 }}
                    className="py-8 group hover:bg-[#FAF4E8]/50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-6">
                      <div className="flex-1">
                        {/* Category Label */}
                        <span className="text-[10px] uppercase font-bold tracking-widest text-[#B4532A] mb-1.5 block">
                          {article.category}
                        </span>

                        {/* Title */}
                        <Link href={`/articles/${article.id}`}>
                          <h2 className="font-serif text-xl sm:text-2xl font-medium text-[#3B2A1E] group-hover:text-[#B4532A] transition-colors leading-snug">
                            {article.title}
                          </h2>
                        </Link>

                        {/* Excerpt */}
                        <p className="text-xs sm:text-sm text-[#7A6552] mt-2 line-clamp-2 leading-relaxed font-light">
                          {article.subtitle || article.content.substring(0, 160) + "..."}
                        </p>

                        {/* Meta row: Author, Date, Reading time, Likes, Comments */}
                        <div className="flex items-center gap-4 mt-4 text-xs text-[#7A6552]">
                          <div className="flex items-center gap-2">
                            <div className="w-5 h-5 rounded-full bg-[#B4532A] text-white flex items-center justify-center text-[10px] font-serif">
                              {article.authorName[0]}
                            </div>
                            <span className="font-medium text-[#3B2A1E]">
                              {article.authorName}
                            </span>
                          </div>

                          <span>·</span>
                          <span>
                            {new Date(article.createdAt).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                            })}
                          </span>
                          <span>·</span>
                          <span>{article.readTime || "5 min read"}</span>

                          <div className="ml-auto flex items-center gap-3">
                            {/* Like count */}
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                toggleLike(article.id);
                              }}
                              className="flex items-center gap-1 hover:text-[#B4532A] transition-colors"
                            >
                              <Heart
                                className={`w-3.5 h-3.5 ${
                                  isLiked ? "fill-[#B4532A] text-[#B4532A]" : ""
                                }`}
                              />
                              <span>{article.likesCount}</span>
                            </button>

                            {/* Comment count */}
                            <Link
                              href={`/articles/${article.id}#comments`}
                              className="flex items-center gap-1 hover:text-[#3B2A1E] transition-colors"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                              <span>{article.commentsCount || 0}</span>
                            </Link>
                          </div>
                        </div>
                      </div>

                      {/* Right Thumbnail if present */}
                      {article.image && (
                        <Link
                          href={`/articles/${article.id}`}
                          className="relative w-24 h-24 sm:w-32 sm:h-24 rounded-lg overflow-hidden shrink-0 shadow-xs border border-[#E6D9C3] bg-[#FFFDF7]"
                        >
                          <Image
                            src={article.image}
                            alt={article.title}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        </Link>
                      )}
                    </div>
                  </motion.article>
                );
              })}
            </AnimatePresence>
          </motion.div>
        ) : (
          <div className="text-center py-20 bg-[#FFFDF7] rounded-xl border border-[#E6D9C3]">
            <BookOpen className="w-10 h-10 text-[#8B5E3C] mx-auto mb-2 opacity-50" />
            <h3 className="font-serif text-lg font-medium">No essays found</h3>
            <p className="text-xs text-[#7A6552] mt-1">
              Select another category or explore our newest additions.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
