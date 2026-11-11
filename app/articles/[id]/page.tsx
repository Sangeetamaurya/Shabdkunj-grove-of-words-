"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Article, Comment } from "@/types";
import { useAuthStore } from "@/store/useAuthStore";
import { useArticleStore } from "@/store/useArticleStore";
import { useToast } from "@/components/ui/Toast";
import * as api from "@/lib/api";
import {
  ArrowLeft,
  Heart,
  MessageSquare,
  Share2,
  Trash2,
  Send,
  Calendar,
  Clock,
} from "lucide-react";

export default function ArticleDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const { user } = useAuthStore();
  const { toggleLike, likedArticleIds } = useArticleStore();
  const { toast, success, error } = useToast();

  const [article, setArticle] = useState<Article | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newCommentText, setNewCommentText] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const art = await api.getArticle(id);
        if (art) {
          setArticle(art);
          const cmts = await api.getComments(id);
          setComments(cmts);
          if (user) {
            const liked = await api.getArticleLikeStatus(id, user.id);
            useArticleStore.setState((state) => {
              const likedArticleIds = new Set(state.likedArticleIds);
              if (liked) likedArticleIds.add(id);
              else likedArticleIds.delete(id);
              return { likedArticleIds };
            });
          }
        } else {
          setArticle(null);
          setComments([]);
        }
      } catch (err: any) {
        setArticle(null);
        setComments([]);
        error(err.message || "Failed to load article");
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [id, user, error]);

  if (isLoading) {
    return (
      <div className="max-w-[680px] mx-auto py-20 px-4 animate-pulse">
        <div className="h-4 bg-[#E6D9C3] rounded w-24 mb-4" />
        <div className="h-10 bg-[#E6D9C3] rounded w-3/4 mb-4" />
        <div className="h-6 bg-[#E6D9C3] rounded w-1/2 mb-8" />
        <div className="aspect-[16/9] bg-[#E6D9C3] rounded-xl mb-8" />
        <div className="space-y-4">
          <div className="h-4 bg-[#E6D9C3] rounded w-full" />
          <div className="h-4 bg-[#E6D9C3] rounded w-5/6" />
        </div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="text-center py-24">
        <h2 className="font-serif text-2xl font-medium">Article not found</h2>
        <Link href="/articles" className="text-xs text-[#B4532A] mt-2 inline-block">
          ← Back to Articles
        </Link>
      </div>
    );
  }

  const isLiked = likedArticleIds.has(article.id);
  const isAdminOrLibrarian = user?.role === "admin" || user?.role === "librarian";

  const handleLike = async () => {
    if (!user) {
      toast("Please log in to like this essay.", "info");
      router.push("/login?redirect=" + encodeURIComponent(window.location.pathname));
      return;
    }
    const ok = await toggleLike(article.id);
    if (ok) {
      setArticle((prev) =>
        prev
          ? {
              ...prev,
              likesCount: prev.likesCount + (isLiked ? -1 : 1),
            }
          : prev
      );
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast("Please log in to leave a comment.", "info");
      router.push("/login?redirect=" + encodeURIComponent(window.location.pathname));
      return;
    }
    if (!newCommentText.trim()) return;

    setIsSubmittingComment(true);
    try {
      const added = await api.addComment(article.id, newCommentText, user);
      setComments((prev) => [added, ...prev]);
      setArticle((prev) =>
        prev ? { ...prev, commentsCount: (prev.commentsCount || 0) + 1 } : prev
      );
      setNewCommentText("");
      success("Comment posted");
    } catch (err: any) {
      error(err.message || "Failed to post comment");
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      await api.deleteComment(commentId, user);
      setComments((prev) => prev.filter((c) => c.id !== commentId));
      setArticle((prev) =>
        prev
          ? { ...prev, commentsCount: Math.max(0, (prev.commentsCount || 1) - 1) }
          : prev
      );
      success("Comment removed");
    } catch (err: any) {
      error(err.message || "Failed to delete comment");
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({ title: article.title, url: window.location.href });
    } else {
      navigator.clipboard.writeText(window.location.href);
      success("Link copied to clipboard");
    }
  };

  return (
    <article className="min-h-screen bg-[#FAF4E8] text-[#3B2A1E] py-12 px-4 sm:px-6">
      <div className="max-w-[680px] mx-auto">
        {/* Back Link */}
        <Link
          href="/articles"
          className="inline-flex items-center gap-2 text-xs font-medium text-[#7A6552] hover:text-[#B4532A] transition-colors mb-8 group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span>Back to reading room</span>
        </Link>

        {/* Category Pill */}
        <span className="text-[11px] font-bold uppercase tracking-widest text-[#B4532A]">
          {article.category}
        </span>

        {/* Title */}
        <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-medium tracking-tight text-[#3B2A1E] mt-3 mb-4 leading-[1.18]">
          {article.title}
        </h1>

        {/* Subtitle */}
        {article.subtitle && (
          <p className="text-base sm:text-lg text-[#7A6552] leading-relaxed mb-6 font-light">
            {article.subtitle}
          </p>
        )}

        {/* Author & Metadata Row */}
        <div className="flex items-center justify-between pb-6 border-b border-[#E6D9C3] mb-8 text-xs text-[#7A6552]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#B4532A] text-white flex items-center justify-center font-serif text-sm font-semibold shadow-xs">
              {article.authorName[0]}
            </div>
            <div>
              <div className="font-semibold text-sm text-[#3B2A1E]">
                {article.authorName}
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <span>
                  {new Date(article.createdAt).toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
                <span>·</span>
                <span>{article.readTime || "6 min read"}</span>
              </div>
            </div>
          </div>

          {/* Social actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleShare}
              className="p-2 rounded-full hover:bg-[#FFFDF7] border border-transparent hover:border-[#E6D9C3] transition-colors"
              title="Share article"
            >
              <Share2 className="w-4 h-4 text-[#7A6552]" />
            </button>
          </div>
        </div>

        {/* Optional Hero Image */}
        {article.image && (
          <div className="relative aspect-[16/10] rounded-xl overflow-hidden shadow-warm-md border border-[#E6D9C3] mb-10">
            <Image
              src={article.image}
              alt={article.title}
              fill
              priority
              className="object-cover"
            />
          </div>
        )}

        {/* Main Article Content (Readable 18px / comfortable 1.6 line height) */}
        <div className="prose prose-stone font-serif text-[17px] sm:text-[18px] leading-[1.75] text-[#3B2A1E] space-y-6">
          {article.content.split("\n\n").map((para, i) => (
            <p key={i}>{para}</p>
          ))}
        </div>

        {/* Floating / Bottom Like & Interactions */}
        <div className="flex items-center justify-between my-12 py-4 border-y border-[#E6D9C3]">
          <div className="flex items-center gap-4">
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={handleLike}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium border transition-colors ${
                isLiked
                  ? "bg-rose-50 border-rose-200 text-rose-700"
                  : "bg-[#FFFDF7] border-[#E6D9C3] text-[#3B2A1E] hover:border-[#8B5E3C]"
              }`}
            >
              <Heart
                className={`w-4 h-4 ${
                  isLiked ? "fill-[#B4532A] text-[#B4532A]" : ""
                }`}
              />
              <span>{article.likesCount} Likes</span>
            </motion.button>

            <a
              href="#comments"
              className="flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium bg-[#FFFDF7] border border-[#E6D9C3] text-[#3B2A1E] hover:border-[#8B5E3C] transition-colors"
            >
              <MessageSquare className="w-4 h-4 text-[#7A6552]" />
              <span>{comments.length} Comments</span>
            </a>
          </div>

          <button
            onClick={handleShare}
            className="text-xs font-medium text-[#7A6552] hover:text-[#B4532A] transition-colors flex items-center gap-1.5"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Share</span>
          </button>
        </div>

        {/* ============================================================
            COMMENTS SECTION
            ============================================================ */}
        <section id="comments" className="pt-4 pb-16">
          <h3 className="font-serif text-2xl font-medium text-[#3B2A1E] mb-6 flex items-center gap-2">
            <span>Comments</span>
            <span className="text-sm font-sans font-normal text-[#7A6552]">
              ({comments.length})
            </span>
          </h3>

          {/* Comment Form */}
          <form onSubmit={handleAddComment} className="mb-10">
            <div className="bg-[#FFFDF7] border border-[#E6D9C3] rounded-xl p-4 shadow-sm focus-within:border-[#8B5E3C] focus-within:ring-1 focus-within:ring-[#8B5E3C] transition-all">
              <textarea
                value={newCommentText}
                onChange={(e) => setNewCommentText(e.target.value)}
                placeholder={
                  user
                    ? "Leave a thoughtful reflection..."
                    : "Log in to join the conversation..."
                }
                rows={3}
                className="w-full bg-transparent resize-none text-sm text-[#3B2A1E] placeholder:text-[#A48F7B] focus:outline-none"
              />
              <div className="flex items-center justify-between pt-2 border-t border-[#E6D9C3]/60 mt-2">
                <span className="text-[11px] text-[#7A6552]">
                  {user ? `Signed in as ${user.name}` : "Guest reader"}
                </span>
                <button
                  type="submit"
                  disabled={isSubmittingComment || !newCommentText.trim()}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-[#182631] hover:bg-[#2A4154] disabled:opacity-50 text-white text-xs font-medium transition-colors shadow-xs"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSubmittingComment ? "Posting..." : "Respond"}</span>
                </button>
              </div>
            </div>
          </form>

          {/* Animated Comments List */}
          <div className="space-y-4">
            <AnimatePresence>
              {comments.map((comment) => {
                const canDelete =
                  user &&
                  (comment.userId === user.id ||
                    user.role === "admin" ||
                    user.role === "librarian");

                return (
                  <motion.div
                    key={comment.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="p-4 rounded-xl bg-[#FFFDF7] border border-[#E6D9C3] shadow-xs"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-[#8B5E3C] text-white flex items-center justify-center font-serif text-xs font-semibold">
                          {comment.userName[0]}
                        </div>
                        <div>
                          <div className="font-semibold text-xs text-[#3B2A1E]">
                            {comment.userName}
                          </div>
                          <div className="text-[10px] text-[#7A6552]">
                            {new Date(comment.createdAt).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                            })}
                          </div>
                        </div>
                      </div>

                      {canDelete && (
                        <button
                          onClick={() => handleDeleteComment(comment.id)}
                          className="text-stone-400 hover:text-red-600 transition-colors p-1"
                          title="Delete comment"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    <p className="mt-3 text-xs sm:text-sm text-[#3B2A1E] leading-relaxed">
                      {comment.text}
                    </p>
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {comments.length === 0 && (
              <div className="text-center py-10 bg-[#FFFDF7] rounded-xl border border-[#E6D9C3] text-xs text-[#7A6552]">
                No comments yet. Be the first to share your thoughts.
              </div>
            )}
          </div>
        </section>
      </div>
    </article>
  );
}
