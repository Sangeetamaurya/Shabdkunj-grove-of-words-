import { create } from "zustand";
import { Article, ArticleFilterParams } from "@/types";
import * as api from "@/lib/api";
import { useAuthStore } from "./useAuthStore";

interface ArticleState {
  articles: Article[];
  isLoading: boolean;
  error: string | null;
  likedArticleIds: Set<string>;

  fetchArticles: (params?: ArticleFilterParams) => Promise<Article[]>;
  toggleLike: (articleId: string) => Promise<boolean>;
  deleteArticle: (articleId: string) => Promise<boolean>;
}

export const useArticleStore = create<ArticleState>((set, get) => ({
  articles: [],
  isLoading: false,
  error: null,
  likedArticleIds: new Set(["a1"]),

  fetchArticles: async (params) => {
    set({ isLoading: true, error: null });
    try {
      const data = await api.getArticles(params);
      set({ articles: data, isLoading: false });
      return data;
    } catch (err: any) {
      set({ error: err.message || "Failed to load articles", isLoading: false });
      return [];
    }
  },

  toggleLike: async (articleId: string) => {
    const user = useAuthStore.getState().user;
    if (!user) return false;

    const { articles, likedArticleIds } = get();
    const isCurrentlyLiked = likedArticleIds.has(articleId);

    // Optimistic update
    const newLiked = new Set(likedArticleIds);
    if (isCurrentlyLiked) newLiked.delete(articleId);
    else newLiked.add(articleId);

    const updated = articles.map((a) =>
      a.id === articleId
        ? { ...a, likesCount: a.likesCount + (isCurrentlyLiked ? -1 : 1) }
        : a
    );

    set({ articles: updated, likedArticleIds: newLiked });

    try {
      await api.toggleArticleLike(articleId, user);
      return true;
    } catch {
      // Rollback
      set({ articles, likedArticleIds });
      return false;
    }
  },

  deleteArticle: async (articleId: string) => {
    const user = useAuthStore.getState().user;
    try {
      await api.deleteArticle(articleId, user);
      set((state) => ({
        articles: state.articles.filter((a) => a.id !== articleId),
      }));
      return true;
    } catch (err: any) {
      set({ error: err.message });
      return false;
    }
  },
}));
