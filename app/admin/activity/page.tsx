"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import { useToast } from "@/components/ui/Toast";
import * as api from "@/lib/api";
import { ArrowLeft } from "lucide-react";

type Row = { id?: string; name?: string; title?: string; author?: string; authorName?: string; status?: string; genre?: string };

export default function LibraryActivityPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { toast, error } = useToast();
  const [activity, setActivity] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    if (!user) {
      router.push("/login?redirect=/admin/activity");
      return;
    }
    if (user.role !== "admin" && user.role !== "librarian") {
      toast("Only librarians and admins can view library activity.", "error");
      router.push("/");
      return;
    }
    api.getLibraryActivity()
      .then(setActivity)
      .catch((err: Error) => error(err.message || "Could not load library activity"));
  }, [user, router, toast, error]);

  if (!user || (user.role !== "admin" && user.role !== "librarian")) return null;

  const books = (activity?.recentBooks as Row[]) || [];
  const articles = (activity?.recentArticles as Row[]) || [];

  return (
    <div className="min-h-screen bg-[#FAF4E8] text-[#3B2A1E] py-12 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto">
        <Link href="/books" className="inline-flex items-center gap-2 text-xs text-[#7A6552] hover:text-[#B4532A] mb-6">
          <ArrowLeft className="w-4 h-4" />
          Back to the library
        </Link>
        <h1 className="font-serif text-3xl font-medium mb-8">Library activity</h1>
        {!activity ? (
          <p className="text-sm text-[#7A6552]">Loading activity...</p>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
              {[
                ["Books", activity.bookCount],
                ["Published", activity.publishedArticleCount],
                ["Drafts", activity.draftArticleCount],
                ["Comments", activity.commentCount],
              ].map(([label, value]) => (
                <div key={String(label)} className="bg-[#FFFDF7] border border-[#E6D9C3] rounded-xl p-4">
                  <div className="text-[10px] uppercase tracking-wider text-[#7A6552]">{label}</div>
                  <div className="font-serif text-2xl mt-1">{Number(value ?? 0)}</div>
                </div>
              ))}
            </div>
            <section className="mb-8">
              <h2 className="font-serif text-xl mb-3">Recent books</h2>
              {books.length === 0 ? <p className="text-sm text-[#7A6552]">No books yet.</p> : books.map((book) => (
                <div key={book.id} className="py-2 border-b border-[#E6D9C3] text-sm">
                  {book.name} <span className="text-[#7A6552]">by {book.author}</span>
                </div>
              ))}
            </section>
            <section>
              <h2 className="font-serif text-xl mb-3">Recent articles</h2>
              {articles.length === 0 ? <p className="text-sm text-[#7A6552]">No articles yet.</p> : articles.map((article) => (
                <div key={article.id} className="py-2 border-b border-[#E6D9C3] text-sm">
                  {article.title} <span className="text-[#7A6552]">{article.status} · {article.authorName}</span>
                </div>
              ))}
            </section>
          </>
        )}
      </div>
    </div>
  );
}
