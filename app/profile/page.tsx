"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from "@hello-pangea/dnd";
import { Book, ReadingEntry, ReadingStatus, Article } from "@/types";
import { useAuthStore } from "@/store/useAuthStore";
import { useBookStore } from "@/store/useBookStore";
import { useReadingStore } from "@/store/useReadingStore";
import { useToast } from "@/components/ui/Toast";
import * as api from "@/lib/api";
import {
  BookOpen,
  Edit2,
  Trash2,
  Plus,
  MoreVertical,
  Layers,
  FileText,
  ExternalLink,
  X,
} from "lucide-react";

const COLUMNS: Array<{ id: ReadingStatus; label: string }> = [
  { id: "wishlist", label: "Wishlist" },
  { id: "reading", label: "Reading" },
  { id: "pending", label: "Pending" },
  { id: "done", label: "Done" },
];

export default function ProfilePage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { openOverlay } = useBookStore();
  const { readingList, fetchReadingList, setStatus, removeEntry } = useReadingStore();
  const { toast, success, error } = useToast();

  const [activeTab, setActiveTab] = useState<"board" | "articles">("board");
  const [allBooks, setAllBooks] = useState<Record<string, Book>>({});
  const [userArticles, setUserArticles] = useState<Article[]>([]);
  const [articleSubTab, setArticleSubTab] = useState<"published" | "drafts">("published");
  const [deleteConfirmArticle, setDeleteConfirmArticle] = useState<Article | null>(null);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileName, setProfileName] = useState("");

  // Route protection
  useEffect(() => {
    if (!user) {
      toast("Please log in to view your reading board.", "info");
      router.push("/login?redirect=/profile");
    } else {
      setProfileName(user.name);
    }
  }, [user, router, toast]);

  // Load books and user reading list
  useEffect(() => {
    async function loadData() {
      if (!user) return;
      try {
        const [booksData] = await Promise.all([
          api.getBooks(),
          fetchReadingList(user.id),
        ]);

        const map: Record<string, Book> = {};
        booksData.forEach((b) => {
          map[b.id] = b;
        });
        setAllBooks(map);

        const articles = await api.getArticles({ authorId: user.id });
        setUserArticles(articles);
      } catch (err: any) {
        error(err.message || "Failed to load your reading board");
      }
    }
    loadData();
  }, [user, fetchReadingList, error]);

  if (!user) return null;

  // Handle Drag & Drop across the 4 Kanban columns
  const onDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    const newStatus = destination.droppableId as ReadingStatus;
    const bookId = draggableId;

    const ok = await setStatus(user.id, bookId, newStatus);
    if (ok) {
      const book = allBooks[bookId];
      success(`Moved "${book?.name || "Book"}" to ${newStatus}`);
    } else {
      error("Could not update status. Restored previous position.");
    }
  };

  const publishedArticles = userArticles.filter((a) => a.status === "published");
  const draftArticles = userArticles.filter((a) => a.status === "draft");

  const handleDeleteArticle = async (articleId: string) => {
    try {
      await api.deleteArticle(articleId, user);
      setUserArticles((prev) => prev.filter((a) => a.id !== articleId));
      setDeleteConfirmArticle(null);
      success("Article deleted");
    } catch (err: any) {
      error(err.message || "Failed to delete article");
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF4E8] text-[#3B2A1E] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* ============================================================
            1. USER HEADER (Matching 04-reading-board.jpg)
            ============================================================ */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-8 border-b border-[#E6D9C3]/70">
          <div className="flex items-center gap-5">
            {/* Avatar Circle with Initials 'AM' */}
            <div className="w-20 h-20 rounded-full bg-[#B4532A] text-[#FAF4E8] font-serif font-semibold text-2xl flex items-center justify-center border-4 border-[#FFFDF7] shadow-warm">
              {user.name
                .split(" ")
                .map((n) => n[0])
                .join("")
                .slice(0, 2)
                .toUpperCase()}
            </div>

            <div>
              <span className="text-[10px] uppercase font-bold tracking-widest text-[#7A6552]">
                MEMBER SINCE 2023 · {user.role.toUpperCase()}
              </span>
              <h1 className="font-serif text-3xl sm:text-4xl font-medium text-[#3B2A1E] mt-0.5">
                {user.name}
              </h1>
              <p className="text-xs text-[#7A6552] mt-1">
                {readingList.length} books saved · {userArticles.length} articles written
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsEditingProfile(true)}
            className="px-4 py-2 rounded-lg border border-[#E6D9C3] bg-[#FFFDF7] hover:border-[#8B5E3C] text-xs font-semibold text-[#3B2A1E] transition-colors self-start sm:self-auto shadow-xs"
          >
            Edit profile
          </button>
        </div>

        {/* ============================================================
            2. TABS: Reading Board vs My Articles
            ============================================================ */}
        <div className="flex items-center gap-8 pt-6 pb-4 border-b border-[#E6D9C3] mb-8">
          <button
            onClick={() => setActiveTab("board")}
            className={`relative pb-3 text-sm font-serif font-medium transition-colors ${
              activeTab === "board"
                ? "text-[#3B2A1E] font-semibold"
                : "text-[#7A6552] hover:text-[#3B2A1E]"
            }`}
          >
            <span>Reading board</span>
            {activeTab === "board" && (
              <motion.div
                layoutId="profile-tab-indicator"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#B4532A] rounded-full"
              />
            )}
          </button>

          <button
            onClick={() => setActiveTab("articles")}
            className={`relative pb-3 text-sm font-serif font-medium transition-colors ${
              activeTab === "articles"
                ? "text-[#3B2A1E] font-semibold"
                : "text-[#7A6552] hover:text-[#3B2A1E]"
            }`}
          >
            <span>My articles</span>
            {activeTab === "articles" && (
              <motion.div
                layoutId="profile-tab-indicator"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#B4532A] rounded-full"
              />
            )}
          </button>
        </div>

        {/* ============================================================
            3. TAB CONTENT
            ============================================================ */}
        {activeTab === "board" ? (
          /* ============================================================
             READING BOARD (4 KANBAN COLUMNS)
             ============================================================ */
          <DragDropContext onDragEnd={onDragEnd}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 overflow-x-auto pb-6">
              {COLUMNS.map((col) => {
                const columnEntries = readingList.filter(
                  (entry) => entry.status === col.id
                );

                return (
                  <div
                    key={col.id}
                    className="flex flex-col bg-[#F4EBD9]/45 rounded-xl border border-[#E6D9C3]/80 p-3.5 min-h-[500px]"
                  >
                    {/* Column Header */}
                    <div className="flex items-center justify-between px-2 py-2 mb-3">
                      <h3 className="font-serif font-medium text-base text-[#3B2A1E]">
                        {col.label}
                      </h3>
                      <span className="text-xs font-mono font-medium text-[#7A6552] bg-[#FAF4E8] px-2 py-0.5 rounded-full border border-[#E6D9C3]">
                        {columnEntries.length}
                      </span>
                    </div>

                    {/* Droppable Area */}
                    <Droppable droppableId={col.id}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.droppableProps}
                          className={`flex-1 flex flex-col gap-2.5 transition-colors rounded-lg p-1 ${
                            snapshot.isDraggingOver ? "bg-[#FAF4E8]/80 ring-2 ring-[#B4532A]/30" : ""
                          }`}
                        >
                          {columnEntries.map((entry, index) => {
                            const book = allBooks[entry.bookId];
                            if (!book) return null;

                            return (
                              <Draggable
                                key={book.id}
                                draggableId={book.id}
                                index={index}
                              >
                                {(dragProvided, dragSnapshot) => (
                                  <div
                                    ref={dragProvided.innerRef}
                                    {...dragProvided.draggableProps}
                                    {...dragProvided.dragHandleProps}
                                    onClick={() => openOverlay(book)}
                                    style={{
                                      ...dragProvided.draggableProps.style,
                                    }}
                                    className={`group relative p-3 rounded-lg bg-[#FAF4E8] border border-[#E6D9C3] shadow-xs cursor-grab active:cursor-grabbing hover:border-[#8B5E3C] transition-all select-none ${
                                      dragSnapshot.isDragging
                                        ? "scale-105 rotate-2 shadow-warm-lg ring-2 ring-[#B4532A] z-50 bg-[#FFFDF7]"
                                        : ""
                                    }`}
                                  >
                                    <div className="flex items-center gap-3">
                                      {/* Mini Book Cover */}
                                      <div className="relative w-11 h-16 rounded overflow-hidden shadow-xs shrink-0 bg-stone-200">
                                        <Image
                                          src={book.coverImage}
                                          alt={book.name}
                                          fill
                                          className="object-cover"
                                        />
                                      </div>

                                      {/* Book Info */}
                                      <div className="flex-1 min-w-0">
                                        <h4 className="font-serif text-sm font-medium text-[#3B2A1E] truncate group-hover:text-[#B4532A] transition-colors">
                                          {book.name}
                                        </h4>
                                        <p className="text-xs text-[#7A6552] truncate mt-0.5">
                                          {book.author}
                                        </p>
                                      </div>

                                      {/* Quick Remove Action */}
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          removeEntry(user.id, book.id);
                                          success(`Removed from ${col.label}`);
                                        }}
                                        className="text-stone-300 hover:text-red-500 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                        title="Remove book from board"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </Draggable>
                            );
                          })}
                          {provided.placeholder}

                          {/* Quick Add link */}
                          <Link
                            href="/books"
                            className="mt-auto py-2 text-center text-xs text-[#7A6552] hover:text-[#B4532A] flex items-center justify-center gap-1 opacity-70 hover:opacity-100 transition-all border border-dashed border-[#E6D9C3] rounded-lg bg-[#FAF4E8]/50"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Add a book</span>
                          </Link>
                        </div>
                      )}
                    </Droppable>
                  </div>
                );
              })}
            </div>
          </DragDropContext>
        ) : (
          /* ============================================================
             MY ARTICLES TAB (Published & Drafts)
             ============================================================ */
          <div className="max-w-4xl">
            {/* Sub-tabs */}
            <div className="flex items-center gap-3 mb-6">
              <button
                onClick={() => setArticleSubTab("published")}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  articleSubTab === "published"
                    ? "bg-[#182631] text-white"
                    : "text-[#7A6552] hover:bg-[#FFFDF7]"
                }`}
              >
                Published ({publishedArticles.length})
              </button>
              <button
                onClick={() => setArticleSubTab("drafts")}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  articleSubTab === "drafts"
                    ? "bg-[#182631] text-white"
                    : "text-[#7A6552] hover:bg-[#FFFDF7]"
                }`}
              >
                Drafts ({draftArticles.length})
              </button>
            </div>

            {/* Articles List */}
            {articleSubTab === "published" ? (
              publishedArticles.length > 0 ? (
                <div className="divide-y divide-[#E6D9C3] bg-[#FFFDF7] rounded-xl border border-[#E6D9C3] p-6 shadow-xs">
                  {publishedArticles.map((art) => (
                    <div
                      key={art.id}
                      className="py-4 first:pt-0 last:pb-0 flex items-center justify-between gap-4"
                    >
                      <div>
                        <span className="text-[10px] uppercase font-bold text-[#B4532A]">
                          {art.category}
                        </span>
                        <Link href={`/articles/${art.id}`}>
                          <h3 className="font-serif text-lg font-medium hover:text-[#B4532A] transition-colors">
                            {art.title}
                          </h3>
                        </Link>
                        <p className="text-xs text-[#7A6552]">
                          {art.likesCount} likes · {art.commentsCount || 0} comments · {art.readTime || "5 min"}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <Link
                          href={`/write/${art.id}`}
                          className="p-2 rounded hover:bg-[#FAF4E8] text-stone-600 hover:text-[#3B2A1E]"
                          title="Edit article"
                        >
                          <Edit2 className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => setDeleteConfirmArticle(art)}
                          className="p-2 rounded hover:bg-red-50 text-stone-400 hover:text-red-600"
                          title="Delete article"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16 bg-[#FFFDF7] rounded-xl border border-[#E6D9C3]">
                  <FileText className="w-10 h-10 text-[#8B5E3C] mx-auto mb-2 opacity-50" />
                  <p className="text-sm font-medium">No published stories yet</p>
                  <Link
                    href="/write"
                    className="mt-3 inline-block px-4 py-2 rounded-full bg-[#182631] text-white text-xs font-medium"
                  >
                    Write your first story
                  </Link>
                </div>
              )
            ) : (
              /* Drafts */
              draftArticles.length > 0 ? (
                <div className="divide-y divide-[#E6D9C3] bg-[#FFFDF7] rounded-xl border border-[#E6D9C3] p-6 shadow-xs">
                  {draftArticles.map((draft) => (
                    <div
                      key={draft.id}
                      className="py-4 first:pt-0 last:pb-0 flex items-center justify-between gap-4"
                    >
                      <div>
                        <span className="text-[10px] uppercase font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
                          DRAFT
                        </span>
                        <h3 className="font-serif text-lg font-medium mt-1">
                          {draft.title}
                        </h3>
                        <p className="text-xs text-[#7A6552]">
                          Last edited{" "}
                          {new Date(draft.createdAt).toLocaleDateString("en-US")}
                        </p>
                      </div>

                      <div className="flex items-center gap-3">
                        <Link
                          href={`/write/${draft.id}`}
                          className="px-3 py-1.5 rounded-full bg-[#FAF4E8] border border-[#E6D9C3] hover:border-[#8B5E3C] text-xs font-semibold text-[#3B2A1E]"
                        >
                          Resume editing
                        </Link>
                        <button
                          onClick={() => setDeleteConfirmArticle(draft)}
                          className="p-1.5 rounded hover:bg-red-50 text-stone-400 hover:text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16 bg-[#FFFDF7] rounded-xl border border-[#E6D9C3] text-xs text-[#7A6552]">
                  No drafts saved.
                </div>
              )
            )}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirmArticle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-[#FFFDF7] p-6 rounded-xl border border-[#E6D9C3] shadow-warm-lg max-w-sm w-full">
            <h3 className="font-serif text-lg font-medium text-[#3B2A1E]">
              Delete this story?
            </h3>
            <p className="text-xs text-[#7A6552] mt-2 mb-6 leading-relaxed">
              Are you sure you want to delete &ldquo;{deleteConfirmArticle.title}&rdquo;? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteConfirmArticle(null)}
                className="px-4 py-1.5 text-xs font-medium text-stone-600 hover:bg-[#FAF4E8] rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteArticle(deleteConfirmArticle.id)}
                className="px-4 py-1.5 text-xs font-semibold bg-red-600 hover:bg-red-700 text-white rounded-lg shadow-xs"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Profile Modal */}
      {isEditingProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-[#FFFDF7] p-6 rounded-xl border border-[#E6D9C3] shadow-warm-lg max-w-sm w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-serif text-lg font-medium text-[#3B2A1E]">
                Edit Profile
              </h3>
              <button onClick={() => setIsEditingProfile(false)}>
                <X className="w-4 h-4 text-stone-500" />
              </button>
            </div>
            <div className="space-y-4 mb-6">
              <div>
                <label className="text-xs font-semibold text-[#7A6552] block mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  className="w-full p-2 text-sm bg-[#FAF4E8] border border-[#E6D9C3] rounded-lg focus:outline-none focus:border-[#8B5E3C]"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setIsEditingProfile(false)}
                className="px-3 py-1.5 text-xs text-stone-600"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (profileName.trim()) {
                    useAuthStore.setState((s) => ({
                      user: s.user ? { ...s.user, name: profileName.trim() } : null,
                    }));
                    success("Profile updated");
                    setIsEditingProfile(false);
                  }
                }}
                className="px-4 py-1.5 rounded-lg bg-[#182631] text-white text-xs font-medium"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
