import { create } from "zustand";
import { Book, BookFilterParams } from "@/types";
import * as api from "@/lib/api";
import { useAuthStore } from "./useAuthStore";

interface BookState {
  books: Book[];
  isLoading: boolean;
  error: string | null;
  selectedBook: Book | null;
  isOverlayOpen: boolean;
  activeReaderBook: Book | null; // For the reading modal (PDF or book reader)
  likedBookIds: Set<string>;

  // Actions
  fetchBooks: (params?: BookFilterParams) => Promise<Book[]>;
  setSelectedBook: (book: Book | null) => void;
  openOverlay: (book: Book) => void;
  closeOverlay: () => void;
  openReader: (book: Book) => void;
  closeReader: () => void;
  toggleLike: (bookId: string) => Promise<boolean>;
  deleteBook: (bookId: string) => Promise<boolean>;
}

export const useBookStore = create<BookState>((set, get) => ({
  books: [],
  isLoading: false,
  error: null,
  selectedBook: null,
  isOverlayOpen: false,
  activeReaderBook: null,
  likedBookIds: new Set<string>(),

  fetchBooks: async (params) => {
    set({ isLoading: true, error: null });
    try {
      const data = await api.getBooks(params);
      set({ books: data, isLoading: false });
      return data;
    } catch (err: any) {
      set({ error: err.message || "Failed to load books", isLoading: false });
      return [];
    }
  },

  setSelectedBook: (book) => set({ selectedBook: book }),

  openOverlay: (book) => {
    set({ selectedBook: book, isOverlayOpen: true });
    const user = useAuthStore.getState().user;
    if (!user) return;
    api.getBookLikeStatus(book.id, user.id).then((liked) => {
      set((state) => {
        const likedBookIds = new Set(state.likedBookIds);
        if (liked) likedBookIds.add(book.id);
        else likedBookIds.delete(book.id);
        return { likedBookIds };
      });
    }).catch(() => {});
  },

  closeOverlay: () => set({ isOverlayOpen: false, selectedBook: null }),

  openReader: (book) => set({ activeReaderBook: book, isOverlayOpen: false }),

  closeReader: () => set({ activeReaderBook: null }),

  toggleLike: async (bookId: string) => {
    const user = useAuthStore.getState().user;
    if (!user) {
      return false;
    }

    const { books, likedBookIds } = get();
    const isCurrentlyLiked = likedBookIds.has(bookId);

    // Optimistic Update
    const newLikedSet = new Set(likedBookIds);
    if (isCurrentlyLiked) {
      newLikedSet.delete(bookId);
    } else {
      newLikedSet.add(bookId);
    }

    const updatedBooks = books.map((b) =>
      b.id === bookId
        ? { ...b, likesCount: b.likesCount + (isCurrentlyLiked ? -1 : 1) }
        : b
    );

    const prevSelected = get().selectedBook;
    const updatedSelected =
      prevSelected && prevSelected.id === bookId
        ? {
            ...prevSelected,
            likesCount: prevSelected.likesCount + (isCurrentlyLiked ? -1 : 1),
          }
        : prevSelected;

    set({
      books: updatedBooks,
      likedBookIds: newLikedSet,
      selectedBook: updatedSelected,
    });

    try {
      const result = await api.toggleBookLike(bookId, user);
      set((state) => ({
        books: state.books.map((book) =>
          book.id === bookId ? { ...book, likesCount: result.likesCount } : book
        ),
        selectedBook:
          state.selectedBook && state.selectedBook.id === bookId
            ? { ...state.selectedBook, likesCount: result.likesCount }
            : state.selectedBook,
        likedBookIds: (() => {
          const likedBookIds = new Set(state.likedBookIds);
          if (result.liked) likedBookIds.add(bookId);
          else likedBookIds.delete(bookId);
          return likedBookIds;
        })(),
      }));
      return true;
    } catch (err) {
      // Rollback on failure
      set({
        books,
        likedBookIds,
        selectedBook: prevSelected,
      });
      return false;
    }
  },

  deleteBook: async (bookId: string) => {
    const user = useAuthStore.getState().user;
    try {
      await api.deleteBook(bookId, user);
      set((state) => ({
        books: state.books.filter((b) => b.id !== bookId),
        isOverlayOpen: false,
        selectedBook: null,
      }));
      return true;
    } catch (err: any) {
      set({ error: err.message });
      return false;
    }
  },
}));
