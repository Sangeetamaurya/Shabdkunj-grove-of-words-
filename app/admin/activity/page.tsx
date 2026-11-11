"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import { useToast } from "@/components/ui/Toast";
import * as api from "@/lib/api";
import { ArrowLeft } from "lucide-react";

type ActivityEvent = { eventType?: string; description?: string; occurredAt?: string };

export default function LibraryActivityPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { toast, error } = useToast();
  const [activity, setActivity] = useState<Record<string, unknown> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

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
    setIsLoading(true);
    setLoadError(null);
    api.getLibraryActivity()
      .then(setActivity)
      .catch((err: Error) => {
        const msg = err.message || "Could not load library activity";
        setLoadError(msg);
        error(msg);
      })
      .finally(() => setIsLoading(false));
  }, [user, router, toast, error]);

  if (!user || (user.role !== "admin" && user.role !== "librarian")) return null;

  const events = (activity?.events as ActivityEvent[]) || [];

  const formatDateTime = (value?: string) => {
    if (!value) return "";
    const normalized = value.includes("T") ? value : value.replace(" ", "T");
    const date = new Date(normalized);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const eventLabel = (type?: string) => {
    switch (type) {
      case "user_registered": return "Registration";
      case "book_added": return "Book added";
      case "article_published": return "Article published";
      default: return "Activity";
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF4E8] text-[#3B2A1E] py-12 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto">
        <Link href="/books" className="inline-flex items-center gap-2 text-xs text-[#7A6552] hover:text-[#B4532A] mb-6">
          <ArrowLeft className="w-4 h-4" />
          Back to the library
        </Link>
        <h1 className="font-serif text-3xl font-medium mb-8">Library activity</h1>
        {isLoading ? (
          <p className="text-sm text-[#7A6552]">Loading activity...</p>
        ) : loadError ? (
          <p className="text-sm text-[#7A6552]">{loadError}</p>
        ) : !activity ? (
          <p className="text-sm text-[#7A6552]">No activity data available.</p>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
              {([
                ["Registered users", activity.userCount],
                ["Books", activity.bookCount],
                ["Published articles", activity.publishedArticleCount],
                ["Comments", activity.commentCount],
              ] as [string, unknown][]).map(([label, value]) => (
                <div key={label} className="bg-[#FFFDF7] border border-[#E6D9C3] rounded-xl p-4">
                  <div className="text-[10px] uppercase tracking-wider text-[#7A6552]">{label}</div>
                  <div className="font-serif text-2xl mt-1">{Number(value ?? 0)}</div>
                </div>
              ))}
            </div>
            <section>
              <h2 className="font-serif text-xl mb-3">Recent activity</h2>
              {events.length === 0 ? (
                <p className="text-sm text-[#7A6552]">No recorded activity yet.</p>
              ) : (
                <div className="bg-[#FFFDF7] border border-[#E6D9C3] rounded-2xl divide-y divide-[#E6D9C3]">
                  {events.map((event, index) => (
                    <div key={`${event.eventType || "event"}-${event.occurredAt || index}`} className="px-5 py-4">
                      <div className="flex items-center justify-between gap-3 mb-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#B4532A]">
                          {eventLabel(event.eventType)}
                        </span>
                        <span className="text-[11px] text-[#7A6552] whitespace-nowrap">
                          {formatDateTime(event.occurredAt)}
                        </span>
                      </div>
                      <p className="text-sm text-[#3B2A1E]">{event.description}</p>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  );
}
