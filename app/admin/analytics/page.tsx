"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import { useToast } from "@/components/ui/Toast";
import * as api from "@/lib/api";
import { ArrowLeft } from "lucide-react";

const LABELS: Record<string, string> = {
  readerCount: "Readers",
  librarianCount: "Librarians",
  adminCount: "Admins",
  bookCount: "Books",
  publishedArticleCount: "Published articles",
  draftArticleCount: "Draft articles",
  commentCount: "Comments",
  likeCount: "Likes",
  readingEntryCount: "Reading board entries",
};

export default function AnalyticsPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { toast, error } = useToast();
  const [stats, setStats] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    if (!user) {
      router.push("/login?redirect=/admin/analytics");
      return;
    }
    if (user.role !== "admin") {
      toast("Only an admin can view website analytics.", "error");
      router.push("/");
      return;
    }
    api.getAnalytics()
      .then(setStats)
      .catch((err: Error) => error(err.message || "Could not load analytics"));
  }, [user, router, toast, error]);

  if (!user || user.role !== "admin") return null;

  return (
    <div className="min-h-screen bg-[#FAF4E8] text-[#3B2A1E] py-12 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto">
        <Link href="/" className="inline-flex items-center gap-2 text-xs text-[#7A6552] hover:text-[#B4532A] mb-6">
          <ArrowLeft className="w-4 h-4" />
          Back
        </Link>
        <h1 className="font-serif text-3xl font-medium mb-8">Website analytics</h1>
        {!stats ? (
          <p className="text-sm text-[#7A6552]">Loading analytics...</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {Object.entries(LABELS).map(([key, label]) => (
              <div key={key} className="bg-[#FFFDF7] border border-[#E6D9C3] rounded-2xl p-5">
                <div className="text-[10px] uppercase tracking-wider text-[#7A6552]">{label}</div>
                <div className="font-serif text-3xl mt-2">{Number(stats[key] ?? 0)}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
