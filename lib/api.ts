import {
  User,
  Book,
  Article,
  Comment,
  ReadingEntry,
  ReadingStatus,
  BookFilterParams,
  ArticleFilterParams,
} from "@/types";
import { fetchBooksFromOpenLibrary } from "./open-library";

const API_BASE = (
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080/ShabdkunjBackend"
).replace(/\/$/, "");

type ErrorBody = { error?: string };

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set("Accept", "application/json");
  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      ...init,
      headers,
      credentials: "include",
    });
  } catch {
    throw new Error("Could not reach the library server.");
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const text = await response.text();
  const data = text ? (JSON.parse(text) as T | ErrorBody) : null;
  if (!response.ok) {
    const message =
      data && typeof data === "object" && "error" in data && data.error
        ? data.error
        : `Request failed (${response.status})`;
    const error = new Error(message) as Error & { status?: number };
    error.status = response.status;
    throw error;
  }
  return data as T;
}

function queryString(params: Record<string, string | number | undefined>): string {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== "") {
      search.set(key, String(value));
    }
  });
  const text = search.toString();
  return text ? `?${text}` : "";
}

export async function getBooks(params: BookFilterParams = {}): Promise<Book[]> {
  const genre = params.genre && params.genre !== "All" ? params.genre : undefined;
  let results = await request<Book[]>(
    `/api/books${queryString({
      genre,
      search: params.search?.trim() || undefined,
      sort: params.sort,
      limit: params.limit,
    })}`
  );
  if (!Array.isArray(results)) {
    return [];
  }

  if (genre && results.length < 5 && typeof window !== "undefined") {
    try {
      const olBooks = await fetchBooksFromOpenLibrary(genre, 10);
      const existingNames = new Set(results.map((book) => book.name.toLowerCase()));
      const extras = olBooks.filter((book) => !existingNames.has(book.name.toLowerCase()));
      results = [...results, ...extras];
      if (params.limit && params.limit > 0) {
        results = results.slice(0, params.limit);
      }
    } catch {
      // The library response still stands when Open Library is unavailable.
    }
  }
  return results;
}

export async function getBook(id: string): Promise<Book | null> {
  try {
    return await request<Book>(`/api/books/${encodeURIComponent(id)}`);
  } catch (error) {
    if ((error as { status?: number }).status === 404) {
      return null;
    }
    throw error;
  }
}

export async function createBook(
  bookData: Omit<Book, "id" | "likesCount" | "createdAt">,
  _user?: User | null
): Promise<Book> {
  return request<Book>("/api/books", {
    method: "POST",
    body: JSON.stringify({
      name: bookData.name,
      author: bookData.author,
      description: bookData.description,
      coverImage: bookData.coverImage,
      genre: bookData.genre,
      pdfUrl: bookData.pdfUrl,
      pages: bookData.pages,
      publishYear: bookData.publishYear,
      openLibraryKey: bookData.openLibraryKey,
      iaId: bookData.iaId,
    }),
  });
}

export async function updateBook(
  id: string,
  bookData: Partial<Book>,
  _user?: User | null
): Promise<Book> {
  return request<Book>(`/api/books/${encodeURIComponent(id)}`, {
    method: "PUT",
    body: JSON.stringify({
      name: bookData.name,
      author: bookData.author,
      description: bookData.description,
      coverImage: bookData.coverImage,
      genre: bookData.genre,
      pdfUrl: bookData.pdfUrl,
      pages: bookData.pages,
      publishYear: bookData.publishYear,
      openLibraryKey: bookData.openLibraryKey,
      iaId: bookData.iaId,
    }),
  });
}

export async function deleteBook(id: string, _user?: User | null): Promise<boolean> {
  await request<boolean>(`/api/books/${encodeURIComponent(id)}`, { method: "DELETE" });
  return true;
}

export async function toggleBookLike(
  bookId: string,
  _user?: User | null
): Promise<{ liked: boolean; likesCount: number }> {
  return request(`/api/books/${encodeURIComponent(bookId)}/like`, { method: "POST" });
}

export async function getBookLikeStatus(bookId: string, _userId?: string): Promise<boolean> {
  try {
    return await request<boolean>(`/api/books/${encodeURIComponent(bookId)}/like`);
  } catch (error) {
    if ((error as { status?: number }).status === 401) {
      return false;
    }
    throw error;
  }
}

export async function getArticles(params: ArticleFilterParams = {}): Promise<Article[]> {
  const articles = await request<Article[]>(
    `/api/articles${queryString({
      category: params.category && params.category !== "All" ? params.category : undefined,
      search: params.search?.trim() || undefined,
      sort: params.sort,
      status: params.status,
      authorId: params.authorId,
      limit: params.limit,
    })}`
  );
  return Array.isArray(articles) ? articles : [];
}

export async function getArticle(id: string): Promise<Article | null> {
  try {
    return await request<Article>(`/api/articles/${encodeURIComponent(id)}`);
  } catch (error) {
    if ((error as { status?: number }).status === 404) {
      return null;
    }
    throw error;
  }
}

export async function createArticle(
  articleData: Omit<Article, "id" | "authorId" | "authorName" | "likesCount" | "commentsCount" | "createdAt">,
  _user?: User | null
): Promise<Article> {
  return request<Article>("/api/articles", {
    method: "POST",
    body: JSON.stringify({
      title: articleData.title,
      subtitle: articleData.subtitle,
      image: articleData.image,
      content: articleData.content,
      category: articleData.category,
      status: articleData.status,
    }),
  });
}

export async function updateArticle(
  id: string,
  articleData: Partial<Article>,
  _user?: User | null
): Promise<Article> {
  return request<Article>(`/api/articles/${encodeURIComponent(id)}`, {
    method: "PUT",
    body: JSON.stringify({
      title: articleData.title,
      subtitle: articleData.subtitle,
      image: articleData.image,
      content: articleData.content,
      category: articleData.category,
      status: articleData.status,
    }),
  });
}

export async function deleteArticle(id: string, _user?: User | null): Promise<boolean> {
  await request<boolean>(`/api/articles/${encodeURIComponent(id)}`, { method: "DELETE" });
  return true;
}

export async function toggleArticleLike(
  articleId: string,
  _user?: User | null
): Promise<{ liked: boolean; likesCount: number }> {
  return request(`/api/articles/${encodeURIComponent(articleId)}/like`, { method: "POST" });
}

export async function getArticleLikeStatus(articleId: string, _userId?: string): Promise<boolean> {
  try {
    return await request<boolean>(`/api/articles/${encodeURIComponent(articleId)}/like`);
  } catch (error) {
    if ((error as { status?: number }).status === 401) {
      return false;
    }
    throw error;
  }
}

export async function getComments(articleId: string): Promise<Comment[]> {
  const comments = await request<Comment[]>(
    `/api/articles/${encodeURIComponent(articleId)}/comments`
  );
  return Array.isArray(comments) ? comments : [];
}

export async function addComment(
  articleId: string,
  text: string,
  _user?: User | null
): Promise<Comment> {
  return request<Comment>(`/api/articles/${encodeURIComponent(articleId)}/comments`, {
    method: "POST",
    body: JSON.stringify({ text }),
  });
}

export async function deleteComment(commentId: string, _user?: User | null): Promise<boolean> {
  await request<boolean>(`/api/comments/${encodeURIComponent(commentId)}`, { method: "DELETE" });
  return true;
}

export async function getReadingList(_userId: string): Promise<ReadingEntry[]> {
  const entries = await request<ReadingEntry[]>("/api/reading");
  return Array.isArray(entries) ? entries : [];
}

export async function setReadingStatus(
  _userId: string,
  bookId: string,
  status: ReadingStatus
): Promise<ReadingEntry> {
  return request<ReadingEntry>("/api/reading", {
    method: "PUT",
    body: JSON.stringify({ bookId, status }),
  });
}

export async function removeFromReadingList(_userId: string, bookId: string): Promise<boolean> {
  await request<boolean>(`/api/reading?bookId=${encodeURIComponent(bookId)}`, {
    method: "DELETE",
  });
  return true;
}

export async function login(email: string, password?: string): Promise<User> {
  return request<User>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password: password ?? "" }),
  });
}

export async function demoLogin(role: "user" | "librarian" | "admin"): Promise<User> {
  return request<User>("/api/auth/demo", {
    method: "POST",
    body: JSON.stringify({ role }),
  });
}

export async function signup(name: string, email: string, password?: string): Promise<User> {
  return request<User>("/api/auth/signup", {
    method: "POST",
    body: JSON.stringify({ name, email, password: password ?? "" }),
  });
}

export async function logout(): Promise<void> {
  await request<void>("/api/auth/logout", { method: "POST" });
}

export async function getUsers(): Promise<User[]> {
  const users = await request<User[]>("/api/admin/users");
  return Array.isArray(users) ? users : [];
}

export async function updateUserRole(id: string, role: "user" | "librarian"): Promise<User> {
  return request<User>(`/api/admin/users/${encodeURIComponent(id)}/role`, {
    method: "PUT",
    body: JSON.stringify({ role }),
  });
}

export async function getLibraryActivity(): Promise<Record<string, unknown>> {
  return request("/api/library/activity");
}

export async function getAnalytics(): Promise<Record<string, unknown>> {
  return request("/api/admin/analytics");
}

export async function getSettings(): Promise<{ libraryName: string; registrationOpen: boolean }> {
  return request("/api/admin/settings");
}

export async function updateSettings(libraryName: string, registrationOpen: boolean) {
  return request<{ libraryName: string; registrationOpen: boolean }>("/api/admin/settings", {
    method: "PUT",
    body: JSON.stringify({ libraryName, registrationOpen }),
  });
}

export async function getCurrentUser(): Promise<User | null> {
  try {
    return await request<User>("/api/auth/me");
  } catch (error) {
    if ((error as { status?: number }).status === 401) {
      return null;
    }
    throw error;
  }
}
