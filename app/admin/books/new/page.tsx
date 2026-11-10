"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import { useToast } from "@/components/ui/Toast";
import * as api from "@/lib/api";
import {
  ArrowLeft,
  Upload,
  FileText,
  BookOpen,
  Sparkles,
  Layers,
  Calendar,
  Image as ImageIcon,
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

export default function NewBookPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { toast, success, error } = useToast();

  const [name, setName] = useState("");
  const [author, setAuthor] = useState("");
  const [genre, setGenre] = useState(GENRES[0]);
  const [description, setDescription] = useState("");
  const [coverImage, setCoverImage] = useState(
    "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=600&auto=format&fit=crop&q=80"
  );
  const [pdfUrl, setPdfUrl] = useState("");
  const [pages, setPages] = useState<number>(320);
  const [publishYear, setPublishYear] = useState<number>(2024);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Route protection
  useEffect(() => {
    if (!user) {
      toast("Authentication required", "info");
      router.push("/login?redirect=/admin/books/new");
    } else if (user.role !== "admin" && user.role !== "librarian") {
      toast("Access denied: Admin or Librarian permissions required.", "error");
      router.push("/books");
    }
  }, [user, router, toast]);

  if (!user || (user.role !== "admin" && user.role !== "librarian")) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !author.trim() || !description.trim()) {
      error("Please fill in all required fields.");
      return;
    }

    setIsSubmitting(true);
    try {
      await api.createBook(
        {
          name: name.trim(),
          author: author.trim(),
          genre,
          description: description.trim(),
          coverImage: coverImage.trim(),
          pdfUrl: pdfUrl.trim() || undefined,
          pages: Number(pages) || 280,
          publishYear: Number(publishYear) || 2024,
          addedBy: user.id,
        },
        user
      );

      success(`Added "${name}" to the library!`);
      router.push("/books");
    } catch (err: any) {
      error(err.message || "Failed to add book");
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
                Add New Book to Shelves
              </h1>
            </div>
            <div className="w-10 h-10 rounded-xl bg-[#8B5E3C] text-white flex items-center justify-center font-serif">
              <BookOpen className="w-5 h-5" />
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Title */}
              <div>
                <label className="block text-xs font-semibold text-[#7A6552] uppercase tracking-wider mb-1.5">
                  Book Title *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. The Picture of Dorian Gray"
                  className="w-full px-3.5 py-2.5 bg-[#FAF4E8] border border-[#E6D9C3] rounded-lg text-sm text-[#3B2A1E] focus:outline-none focus:border-[#8B5E3C]"
                />
              </div>

              {/* Author */}
              <div>
                <label className="block text-xs font-semibold text-[#7A6552] uppercase tracking-wider mb-1.5">
                  Author Name *
                </label>
                <input
                  type="text"
                  required
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  placeholder="e.g. Oscar Wilde"
                  className="w-full px-3.5 py-2.5 bg-[#FAF4E8] border border-[#E6D9C3] rounded-lg text-sm text-[#3B2A1E] focus:outline-none focus:border-[#8B5E3C]"
                />
              </div>
            </div>

            {/* Genre & Publish Year & Pages */}
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
                  placeholder="e.g. 1890"
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
                  placeholder="e.g. 320"
                  className="w-full px-3.5 py-2.5 bg-[#FAF4E8] border border-[#E6D9C3] rounded-lg text-sm text-[#3B2A1E] focus:outline-none focus:border-[#8B5E3C]"
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-semibold text-[#7A6552] uppercase tracking-wider mb-1.5">
                Description / Synopsis *
              </label>
              <textarea
                required
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="A compelling synopsis for our library readers..."
                className="w-full px-3.5 py-2.5 bg-[#FAF4E8] border border-[#E6D9C3] rounded-lg text-sm text-[#3B2A1E] focus:outline-none focus:border-[#8B5E3C] resize-none"
              />
            </div>

            {/* Cover Image Upload & Preview */}
            <div className="p-4 bg-[#FAF4E8]/60 border border-[#E6D9C3] rounded-xl flex flex-col sm:flex-row items-center gap-6">
              <div className="relative w-24 h-36 rounded-md shadow-md overflow-hidden bg-stone-200 shrink-0">
                <Image
                  src={coverImage}
                  alt="Cover preview"
                  fill
                  className="object-cover"
                />
              </div>
              <div className="flex-1 w-full">
                <label className="block text-xs font-semibold text-[#7A6552] uppercase tracking-wider mb-1">
                  Cover Image URL
                </label>
                <input
                  type="url"
                  value={coverImage}
                  onChange={(e) => setCoverImage(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-3 py-2 bg-[#FFFDF7] border border-[#E6D9C3] rounded-lg text-xs text-[#3B2A1E] focus:outline-none focus:border-[#8B5E3C]"
                />
                <p className="text-[11px] text-[#7A6552] mt-1">
                  Supports Unsplash, Open Library, or remote image placeholders.
                </p>
              </div>
            </div>

            {/* Book PDF Upload / Attachment (Requested by user) */}
            <div className="p-4 bg-[#FAF4E8]/60 border border-[#E6D9C3] rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="w-4 h-4 text-[#B4532A]" />
                <span className="text-xs font-semibold text-[#3B2A1E] uppercase tracking-wider">
                  Digital Edition / Book PDF Upload
                </span>
              </div>
              <p className="text-xs text-[#7A6552] mb-3">
                Upload a PDF file from your device, or enter a direct PDF link so readers can read the complete book.
              </p>

              <div className="space-y-3">
                {/* File picker */}
                <div className="flex items-center gap-3">
                  <label className="cursor-pointer px-4 py-2 rounded-lg bg-[#182631] text-white hover:bg-[#2A4154] text-xs font-medium transition-colors inline-flex items-center gap-2 shadow-xs">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Choose PDF File</span>
                    <input
                      type="file"
                      accept="application/pdf"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = () => {
                            setPdfUrl(reader.result as string);
                            toast(`Uploaded "${file.name}" (${(file.size / 1024 / 1024).toFixed(1)} MB)`, "success");
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                  </label>
                  {pdfUrl && pdfUrl.startsWith("data:application/pdf") && (
                    <span className="text-xs text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded font-medium">
                      ✓ PDF ready for reading
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 text-xs text-[#7A6552]">
                  <span className="uppercase text-[10px] font-bold">Or</span>
                  <span>enter a direct PDF link:</span>
                </div>

                <input
                  type="url"
                  value={pdfUrl.startsWith("data:") ? "" : pdfUrl}
                  onChange={(e) => setPdfUrl(e.target.value)}
                  placeholder="https://www.gutenberg.org/files/.../....pdf"
                  className="w-full px-3 py-2 bg-[#FFFDF7] border border-[#E6D9C3] rounded-lg text-xs text-[#3B2A1E] focus:outline-none focus:border-[#8B5E3C]"
                />
              </div>
            </div>

            {/* Submit Buttons */}
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
                <Upload className="w-4 h-4" />
                <span>{isSubmitting ? "Adding Book..." : "Add to Library"}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
