import { create } from "zustand";
import { ReadingEntry, ReadingStatus } from "@/types";
import * as api from "@/lib/api";

interface ReadingState {
  readingList: ReadingEntry[];
  isLoading: boolean;
  error: string | null;

  fetchReadingList: (userId: string) => Promise<ReadingEntry[]>;
  setStatus: (userId: string, bookId: string, status: ReadingStatus) => Promise<boolean>;
  removeEntry: (userId: string, bookId: string) => Promise<boolean>;
  getEntryForBook: (bookId: string) => ReadingEntry | undefined;
}

export const useReadingStore = create<ReadingState>((set, get) => ({
  readingList: [],
  isLoading: false,
  error: null,

  fetchReadingList: async (userId: string) => {
    set({ isLoading: true, error: null });
    try {
      const data = await api.getReadingList(userId);
      set({ readingList: data, isLoading: false });
      return data;
    } catch (err: any) {
      set({ error: err.message || "Failed to load reading list", isLoading: false });
      return [];
    }
  },

  setStatus: async (userId: string, bookId: string, status: ReadingStatus) => {
    const prevList = get().readingList;
    const existingIndex = prevList.findIndex(
      (r) => r.userId === userId && r.bookId === bookId
    );

    // Optimistic Update
    let updatedList: ReadingEntry[];
    if (existingIndex !== -1) {
      updatedList = [...prevList];
      updatedList[existingIndex] = {
        ...updatedList[existingIndex],
        status,
        updatedAt: new Date().toISOString(),
      };
    } else {
      updatedList = [
        ...prevList,
        {
          id: `temp_${Date.now()}`,
          userId,
          bookId,
          status,
          updatedAt: new Date().toISOString(),
        },
      ];
    }

    set({ readingList: updatedList });

    try {
      const result = await api.setReadingStatus(userId, bookId, status);
      // Replace temp entry with confirmed result
      set((state) => ({
        readingList: state.readingList.map((item) =>
          item.userId === userId && item.bookId === bookId ? result : item
        ),
      }));
      return true;
    } catch (err: any) {
      // Rollback on failure
      set({ readingList: prevList, error: "Failed to update reading status" });
      return false;
    }
  },

  removeEntry: async (userId: string, bookId: string) => {
    const prevList = get().readingList;
    set({
      readingList: prevList.filter(
        (r) => !(r.userId === userId && r.bookId === bookId)
      ),
    });

    try {
      await api.removeFromReadingList(userId, bookId);
      return true;
    } catch (err: any) {
      set({ readingList: prevList, error: "Failed to remove book" });
      return false;
    }
  },

  getEntryForBook: (bookId: string) => {
    return get().readingList.find((r) => r.bookId === bookId);
  },
}));
