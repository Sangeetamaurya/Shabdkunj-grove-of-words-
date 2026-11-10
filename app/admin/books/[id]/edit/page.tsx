"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import { useToast } from "@/components/ui/Toast";
import * as api from "@/lib/api";
import {
  ArrowLeft,
  Save,
  FileText,
  BookOpen,
} from "lucide-react";

const GENRES = [
  "Fiction",
  "Science",
  "Physics",
  "Love & Romance",
  "Knowledge",
  "About Life",
  "Philosophy",
  "History",
  "Mystery & Thriller",
  "Poetry",
  "Art & Design",
  "Technology",
  "Psychology",
  "Biography & Memoir",
  "Classics",
];

export default function EditBookPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const { user } = useAuthStore();
  const { toast, success, error } = useToast();

  const [name, setName] = useState("");
  const [author, setAuthor] = useState("");
  const [genre, setGenre] = useState(GENRES[0]);
  const [description, setDescription] = useState("");
  const [coverImage, setCoverImage] = useState("");
  const [pdfUrl, setPdfUrl] = useState("");
  const [pages, setPages] = useState<number>(300);
  const [publishYear, setPublishYear] = useState<number>(2020);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function loadBook() {
      setIsLoading(true);
      const book = await api.getBook(id);
      if (book) {
        setName(book.name);
        setAuthor(book.author);
        setGenre(book.genre);
        setDescription(book.description);
        setCoverImage(book.coverImage);
        setPdfUrl(book.pdfUrl || "");
        setPages(book.pages || 300);
        setPublishYear(Number(book.publishYear) || 2020);
      }
      setIsLoading(false);
    }
    loadBook();
  }, [id]);

  // Route protection
  useEffect(() => {
    if (!user) {
      toast("Authentication required", "info");
      router.push(`/login?redirect=/admin/books/${id}/edit`);
    } else if (user.role !== "admin" && user.role !== "librarian") {
      toast("Access denied: Admin or Librarian permissions required.", "error");
      router.push("/books");
    }
  }, [user, router, toast, id]);

  if (!user || (user.role !== "admin" && user.role !== "librarian") || isLoading) {
    return (
      <div className="max-w-3xl mx-auto py-20 px-4 animate-pulse">
        <div className="h-8 bg-[#E6D9C3] rounded w-1/3 mb-6" />
        <div className="h-64 bg-[#E6D9C3] rounded w-full" />
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !author.trim() || !description.trim()) {
      error("Please fill in all required fields.");
      return;
    }

    setIsSubmitting(true);
    try {
      await api.updateBook(
        id,
        {
          name: name.trim(),
          author: author.trim(),
          genre,
          description: description.trim(),
          coverImage: coverImage.trim(),
          pdfUrl: pdfUrl.trim() || undefined,
          pages: Number(pages) || 280,
          publishYear: Number(publishYear) || 2024,
        },
        user
      );

      success(`Updated "${name}" details successfully!`);
      router.push("/books");
    } catch (err: any) {
      error(err.message || "Failed to update book");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF4E8] text-[#3B2A1E] py-12 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto">
        <Link
          href="/books"
          className="inline-flex items-center gap-2 text-xs font-medium text-[#7A6552] hover:text-[#B4532A] transition-colors mb-6 group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span>Back to shelves</span>
        </Link>

        <div className="bg-[#FFFDF7] rounded-2xl border border-[#E6D9C3] p-6 sm:p-10 shadow-warm-lg">
          <div className="flex items-center justify-between pb-6 mb-8 border-b border-[#E6D9C3]">
            <div>
              <span className="text-[10px] uppercase font-bold tracking-widest text-[#B4532A]">
                LIBRARIAN CURATION
              </span>
              <h1 className="font-serif text-2xl sm:text-3xl font-medium mt-1">
                Edit Book Details
              </h1>
            </div>
            <div className="w-10 h-10 rounded-xl bg-[#8B5E3C] text-white flex items-center justify-center font-serif">
              <BookOpen className="w-5 h-5" />
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-semibold text-[#7A6552] uppercase tracking-wider mb-1.5">
                  Book Title *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#FAF4E8] border border-[#E6D9C3] rounded-lg text-sm text-[#3B2A1E] focus:outline-none focus:border-[#8B5E3C]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#7A6552] uppercase tracking-wider mb-1.5">
                  Author Name *
                </label>
                <input
                  type="text"
                  required
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#FAF4E8] border border-[#E6D9C3] rounded-lg text-sm text-[#3B2A1E] focus:outline-none focus:border-[#8B5E3C]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div>
                <label className="block text-xs font-semibold text-[#7A6552] uppercase tracking-wider mb-1.5">
                  Genre *
                </label>
                <select
                  value={genre}
                  onChange={(e) => setGenre(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#FAF4E8] border border-[#E6D9C3] rounded-lg text-sm text-[#3B2A1E] focus:outline-none focus:border-[#8B5E3C]"
                >
                  {GENRES.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#7A6552] uppercase tracking-wider mb-1.5">
                  Publish Year
                </label>
                <input
                  type="number"
                  value={publishYear}
                  onChange={(e) => setPublishYear(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 bg-[#FAF4E8] border border-[#E6D9C3] rounded-lg text-sm text-[#3B2A1E] focus:outline-none focus:border-[#8B5E3C]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#7A6552] uppercase tracking-wider mb-1.5">
                  Page Count
                </label>
                <input
                  type="number"
                  value={pages}
                  onChange={(e) => setPages(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 bg-[#FAF4E8] border border-[#E6D9C3] rounded-lg text-sm text-[#3B2A1E] focus:outline-none focus:border-[#8B5E3C]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#7A6552] uppercase tracking-wider mb-1.5">
                Description / Synopsis *
              </label>
              <textarea
                required
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#FAF4E8] border border-[#E6D9C3] rounded-lg text-sm text-[#3B2A1E] focus:outline-none focus:border-[#8B5E3C] resize-none"
              />
            </div>

            <div className="p-4 bg-[#FAF4E8]/60 border border-[#E6D9C3] rounded-xl flex flex-col sm:flex-row items-center gap-6">
              {coverImage && (
                <div className="relative w-24 h-36 rounded-md shadow-md overflow-hidden bg-stone-200 shrink-0">
                  <Image
                    src={coverImage}
                    alt="Cover preview"
                    fill
                    className="object-cover"
                  />
                </div>
              )}
              <div className="flex-1 w-full">
                <label className="block text-xs font-semibold text-[#7A6552] uppercase tracking-wider mb-1">
                  Cover Image URL
                </label>
                <input
                  type="url"
                  value={coverImage}
                  onChange={(e) => setCoverImage(e.target.value)}
                  className="w-full px-3 py-2 bg-[#FFFDF7] border border-[#E6D9C3] rounded-lg text-xs text-[#3B2A1E] focus:outline-none focus:border-[#8B5E3C]"
                />
              </div>
            </div>

            <div className="p-4 bg-[#FAF4E8]/60 border border-[#E6D9C3] rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="w-4 h-4 text-[#B4532A]" />
                <span className="text-xs font-semibold text-[#3B2A1E] uppercase tracking-wider">
                  Digital Edition / PDF Upload
                </span>
              </div>
              <input
                type="url"
                value={pdfUrl}
                onChange={(e) => setPdfUrl(e.target.value)}
                placeholder="https://www.gutenberg.org/files/.../....pdf"
                className="w-full px-3 py-2 bg-[#FFFDF7] border border-[#E6D9C3] rounded-lg text-xs text-[#3B2A1E] focus:outline-none focus:border-[#8B5E3C]"
              />
            </div>

            <div className="flex items-center justify-end gap-4 pt-4 border-t border-[#E6D9C3]">
              <Link
                href="/books"
                className="px-5 py-2.5 rounded-full border border-[#E6D9C3] text-xs font-semibold text-stone-600 hover:bg-[#FAF4E8] transition-colors"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-7 py-2.5 rounded-full bg-[#182631] hover:bg-[#2A4154] text-white text-xs font-semibold uppercase tracking-wider transition-colors shadow-sm flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                <span>{isSubmitting ? "Saving..." : "Save Changes"}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
