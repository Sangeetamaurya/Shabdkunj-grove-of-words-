import {
  User,
  Book,
  Article,
  Comment,
  Like,
  ReadingEntry,
  ReadingStatus,
  BookFilterParams,
  ArticleFilterParams,
} from "@/types";
import {
  MOCK_USERS,
  MOCK_BOOKS,
  MOCK_ARTICLES,
  MOCK_COMMENTS,
  MOCK_LIKES,
  MOCK_READING_LIST,
} from "./mock-data";
import { fetchBooksFromOpenLibrary } from "./open-library";

// Helper delay to simulate real network request
const delay = (ms = 350) => new Promise((resolve) => setTimeout(resolve, ms));

// LocalStorage Persistence Keys
const STORAGE_KEYS = {
  USERS: "shabdkunj_users",
  BOOKS: "shabdkunj_books",
  ARTICLES: "shabdkunj_articles",
  COMMENTS: "shabdkunj_comments",
  LIKES: "shabdkunj_likes",
  READING_LIST: "shabdkunj_reading_list",
  CURRENT_USER: "shabdkunj_current_user",
};

// Safe access to browser storage
function getStorageItem<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function setStorageItem<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error("Storage error:", e);
  }
}

// In-memory runtime cache for server & client
let runtimeBooks: Book[] = [...MOCK_BOOKS];
let runtimeArticles: Article[] = [...MOCK_ARTICLES];
let runtimeComments: Comment[] = [...MOCK_COMMENTS];
let runtimeLikes: Like[] = [...MOCK_LIKES];
let runtimeReadingList: ReadingEntry[] = [...MOCK_READING_LIST];
let runtimeUsers: User[] = [...MOCK_USERS];

function initClientState() {
  if (typeof window !== "undefined") {
    runtimeBooks = getStorageItem<Book[]>(STORAGE_KEYS.BOOKS, MOCK_BOOKS);
    runtimeArticles = getStorageItem<Article[]>(STORAGE_KEYS.ARTICLES, MOCK_ARTICLES);
    runtimeComments = getStorageItem<Comment[]>(STORAGE_KEYS.COMMENTS, MOCK_COMMENTS);
    runtimeLikes = getStorageItem<Like[]>(STORAGE_KEYS.LIKES, MOCK_LIKES);
    runtimeReadingList = getStorageItem<ReadingEntry[]>(STORAGE_KEYS.READING_LIST, MOCK_READING_LIST);
    runtimeUsers = getStorageItem<User[]>(STORAGE_KEYS.USERS, MOCK_USERS);
  }
}

// Initialize on module load
if (typeof window !== "undefined") {
  initClientState();
}

// ==========================================
// BOOKS API
// ==========================================

export async function getBooks(params: BookFilterParams = {}): Promise<Book[]> {
  await delay(300);
  initClientState();

  let results = [...runtimeBooks];

  // If a specific genre is requested, optionally augment with Open Library books if online
  if (params.genre && params.genre !== "All") {
    results = results.filter(
      (b) => b.genre.toLowerCase() === params.genre?.toLowerCase()
    );

    // If few books exist locally for this genre, attempt live Open Library fetch
    if (results.length < 5 && typeof window !== "undefined") {
      try {
        const olBooks = await fetchBooksFromOpenLibrary(params.genre, 10);
        if (olBooks.length > 0) {
          // Merge unique by name or id
          const existingNames = new Set(results.map((b) => b.name.toLowerCase()));
          const newBooks = olBooks.filter(
            (b) => !existingNames.has(b.name.toLowerCase())
          );
          results = [...results, ...newBooks];
          runtimeBooks = [...runtimeBooks, ...newBooks];
          setStorageItem(STORAGE_KEYS.BOOKS, runtimeBooks);
        }
      } catch {
        // Fallback gracefully
      }
    }
  }

  // Search filter (name or author, case-insensitive)
  if (params.search && params.search.trim() !== "") {
    const q = params.search.toLowerCase().trim();
    results = results.filter(
      (b) =>
        b.name.toLowerCase().includes(q) ||
        b.author.toLowerCase().includes(q) ||
        b.genre.toLowerCase().includes(q)
    );
  }

  // Sort
  if (params.sort === "top") {
    // Sort by likesCount desc
    results.sort((a, b) => b.likesCount - a.likesCount);
  } else if (params.sort === "trending") {
    // Sort by recent likes (or likesCount with created freshness)
    results.sort((a, b) => {
      const scoreA = a.likesCount * 1.5 + new Date(a.createdAt).getTime() / 1e11;
      const scoreB = b.likesCount * 1.5 + new Date(b.createdAt).getTime() / 1e11;
      return scoreB - scoreA;
    });
  } else {
    // Default: latest created first
    results.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  if (params.limit && params.limit > 0) {
    results = results.slice(0, params.limit);
  }

  return results;
}

export async function getBook(id: string): Promise<Book | null> {
  await delay(250);
  initClientState();
  const book = runtimeBooks.find((b) => b.id === id);
  return book || null;
}

export async function createBook(
  bookData: Omit<Book, "id" | "likesCount" | "createdAt">,
  user?: User | null
): Promise<Book> {
  await delay(400);
  initClientState();

  // Role check: Admin or Librarian only
  if (!user || (user.role !== "admin" && user.role !== "librarian")) {
    throw new Error("Unauthorized: Only Admins or Librarians can add new books.");
  }

  const newBook: Book = {
    ...bookData,
    id: `b_${Date.now()}`,
    likesCount: 0,
    createdAt: new Date().toISOString(),
    addedBy: user.id,
  };

  runtimeBooks = [newBook, ...runtimeBooks];
  setStorageItem(STORAGE_KEYS.BOOKS, runtimeBooks);
  return newBook;
}

export async function updateBook(
  id: string,
  bookData: Partial<Book>,
  user?: User | null
): Promise<Book> {
  await delay(400);
  initClientState();

  // Role check
  if (!user || (user.role !== "admin" && user.role !== "librarian")) {
    throw new Error("Unauthorized: Only Admins or Librarians can edit books.");
  }

  const index = runtimeBooks.findIndex((b) => b.id === id);
  if (index === -1) {
    throw new Error("Book not found");
  }

  const updated: Book = {
    ...runtimeBooks[index],
    ...bookData,
  };

  runtimeBooks[index] = updated;
  setStorageItem(STORAGE_KEYS.BOOKS, runtimeBooks);
  return updated;
}

export async function deleteBook(id: string, user?: User | null): Promise<boolean> {
  await delay(400);
  initClientState();

  // Role check
  if (!user || (user.role !== "admin" && user.role !== "librarian")) {
    throw new Error("Unauthorized: Only Admins or Librarians can delete books.");
  }

  runtimeBooks = runtimeBooks.filter((b) => b.id !== id);
  setStorageItem(STORAGE_KEYS.BOOKS, runtimeBooks);

  // Also remove from reading lists
  runtimeReadingList = runtimeReadingList.filter((r) => r.bookId !== id);
  setStorageItem(STORAGE_KEYS.READING_LIST, runtimeReadingList);

  return true;
}

export async function toggleBookLike(
  bookId: string,
  user?: User | null
): Promise<{ liked: boolean; likesCount: number }> {
  await delay(250);
  initClientState();

  if (!user) {
    throw new Error("Login required to like a book.");
  }

  const bookIndex = runtimeBooks.findIndex((b) => b.id === bookId);
  if (bookIndex === -1) throw new Error("Book not found");

  const existingLikeIndex = runtimeLikes.findIndex(
    (l) => l.userId === user.id && l.targetType === "book" && l.targetId === bookId
  );

  let liked = false;
  if (existingLikeIndex !== -1) {
    // Remove like
    runtimeLikes.splice(existingLikeIndex, 1);
    runtimeBooks[bookIndex].likesCount = Math.max(0, runtimeBooks[bookIndex].likesCount - 1);
    liked = false;
  } else {
    // Add like
    runtimeLikes.push({
      id: `l_${Date.now()}`,
      userId: user.id,
      targetType: "book",
      targetId: bookId,
      createdAt: new Date().toISOString(),
    });
    runtimeBooks[bookIndex].likesCount += 1;
    liked = true;
  }

  setStorageItem(STORAGE_KEYS.LIKES, runtimeLikes);
  setStorageItem(STORAGE_KEYS.BOOKS, runtimeBooks);

  return {
    liked,
    likesCount: runtimeBooks[bookIndex].likesCount,
  };
}

export async function getBookLikeStatus(bookId: string, userId?: string): Promise<boolean> {
  if (!userId) return false;
  initClientState();
  return runtimeLikes.some(
    (l) => l.userId === userId && l.targetType === "book" && l.targetId === bookId
  );
}

// ==========================================
// ARTICLES API
// ==========================================

export async function getArticles(params: ArticleFilterParams = {}): Promise<Article[]> {
  await delay(300);
  initClientState();

  let results = [...runtimeArticles];

  // Filter by status (default: published)
  if (params.status) {
    results = results.filter((a) => a.status === params.status);
  } else if (!params.authorId) {
    results = results.filter((a) => a.status === "published");
  }

  // Filter by category
  if (params.category && params.category !== "All") {
    results = results.filter((a) => a.category.toLowerCase() === params.category?.toLowerCase());
  }

  // Filter by author
  if (params.authorId) {
    results = results.filter((a) => a.authorId === params.authorId);
  }

  // Search by title or author
  if (params.search && params.search.trim() !== "") {
    const q = params.search.toLowerCase().trim();
    results = results.filter(
      (a) =>
        a.title.toLowerCase().includes(q) ||
        a.authorName.toLowerCase().includes(q) ||
        (a.subtitle && a.subtitle.toLowerCase().includes(q))
    );
  }

  // Sort
  if (params.sort === "top") {
    results.sort((a, b) => b.likesCount - a.likesCount);
  } else if (params.sort === "trending") {
    results.sort((a, b) => {
      const scoreA = a.likesCount * 2 + (a.commentsCount || 0) * 3;
      const scoreB = b.likesCount * 2 + (b.commentsCount || 0) * 3;
      return scoreB - scoreA;
    });
  } else {
    // Latest
    results.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  if (params.limit && params.limit > 0) {
    results = results.slice(0, params.limit);
  }

  return results;
}

export async function getArticle(id: string): Promise<Article | null> {
  await delay(250);
  initClientState();
  const article = runtimeArticles.find((a) => a.id === id);
  return article || null;
}

export async function createArticle(
  articleData: Omit<Article, "id" | "authorId" | "authorName" | "likesCount" | "commentsCount" | "createdAt">,
  user?: User | null
): Promise<Article> {
  await delay(400);
  initClientState();

  if (!user) {
    throw new Error("Authentication required to write an article.");
  }

  const wordCount = articleData.content.split(/\s+/).length;
  const readTimeMinutes = Math.max(1, Math.ceil(wordCount / 200));

  const newArticle: Article = {
    ...articleData,
    id: `a_${Date.now()}`,
    authorId: user.id,
    authorName: user.name,
    authorAvatar: user.avatar,
    likesCount: 0,
    commentsCount: 0,
    createdAt: new Date().toISOString(),
    readTime: `${readTimeMinutes} min read`,
  };

  runtimeArticles = [newArticle, ...runtimeArticles];
  setStorageItem(STORAGE_KEYS.ARTICLES, runtimeArticles);
  return newArticle;
}

export async function updateArticle(
  id: string,
  articleData: Partial<Article>,
  user?: User | null
): Promise<Article> {
  await delay(400);
  initClientState();

  if (!user) throw new Error("Authentication required.");

  const index = runtimeArticles.findIndex((a) => a.id === id);
  if (index === -1) throw new Error("Article not found");

  const existing = runtimeArticles[index];
  // Author can edit own; Admin/Librarian can also manage
  if (existing.authorId !== user.id && user.role !== "admin" && user.role !== "librarian") {
    throw new Error("Unauthorized to edit this article.");
  }

  const updated: Article = {
    ...existing,
    ...articleData,
  };

  runtimeArticles[index] = updated;
  setStorageItem(STORAGE_KEYS.ARTICLES, runtimeArticles);
  return updated;
}

export async function deleteArticle(id: string, user?: User | null): Promise<boolean> {
  await delay(400);
  initClientState();

  if (!user) throw new Error("Authentication required.");

  const article = runtimeArticles.find((a) => a.id === id);
  if (!article) throw new Error("Article not found");

  // Author can delete their own; Admin and Librarian can delete any article
  if (article.authorId !== user.id && user.role !== "admin" && user.role !== "librarian") {
    throw new Error("Unauthorized: You do not have permission to delete this article.");
  }

  runtimeArticles = runtimeArticles.filter((a) => a.id !== id);
  setStorageItem(STORAGE_KEYS.ARTICLES, runtimeArticles);

  // Remove comments
  runtimeComments = runtimeComments.filter((c) => c.articleId !== id);
  setStorageItem(STORAGE_KEYS.COMMENTS, runtimeComments);

  return true;
}

export async function toggleArticleLike(
  articleId: string,
  user?: User | null
): Promise<{ liked: boolean; likesCount: number }> {
  await delay(250);
  initClientState();

  if (!user) throw new Error("Login required to like an article.");

  const articleIndex = runtimeArticles.findIndex((a) => a.id === articleId);
  if (articleIndex === -1) throw new Error("Article not found");

  const existingLikeIndex = runtimeLikes.findIndex(
    (l) => l.userId === user.id && l.targetType === "article" && l.targetId === articleId
  );

  let liked = false;
  if (existingLikeIndex !== -1) {
    runtimeLikes.splice(existingLikeIndex, 1);
    runtimeArticles[articleIndex].likesCount = Math.max(0, runtimeArticles[articleIndex].likesCount - 1);
    liked = false;
  } else {
    runtimeLikes.push({
      id: `l_${Date.now()}`,
      userId: user.id,
      targetType: "article",
      targetId: articleId,
      createdAt: new Date().toISOString(),
    });
    runtimeArticles[articleIndex].likesCount += 1;
    liked = true;
  }

  setStorageItem(STORAGE_KEYS.LIKES, runtimeLikes);
  setStorageItem(STORAGE_KEYS.ARTICLES, runtimeArticles);

  return {
    liked,
    likesCount: runtimeArticles[articleIndex].likesCount,
  };
}

export async function getArticleLikeStatus(articleId: string, userId?: string): Promise<boolean> {
  if (!userId) return false;
  initClientState();
  return runtimeLikes.some(
    (l) => l.userId === userId && l.targetType === "article" && l.targetId === articleId
  );
}

// ==========================================
// COMMENTS API
// ==========================================

export async function getComments(articleId: string): Promise<Comment[]> {
  await delay(250);
  initClientState();
  return runtimeComments
    .filter((c) => c.articleId === articleId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function addComment(
  articleId: string,
  text: string,
  user?: User | null
): Promise<Comment> {
  await delay(300);
  initClientState();

  if (!user) throw new Error("Login required to comment.");
  if (!text || text.trim() === "") throw new Error("Comment text cannot be empty.");

  const newComment: Comment = {
    id: `c_${Date.now()}`,
    articleId,
    userId: user.id,
    userName: user.name,
    userAvatar: user.avatar,
    text: text.trim(),
    createdAt: new Date().toISOString(),
  };

  runtimeComments = [newComment, ...runtimeComments];
  setStorageItem(STORAGE_KEYS.COMMENTS, runtimeComments);

  // Sync article comment count
  const articleIndex = runtimeArticles.findIndex((a) => a.id === articleId);
  if (articleIndex !== -1) {
    runtimeArticles[articleIndex].commentsCount = (runtimeArticles[articleIndex].commentsCount || 0) + 1;
    setStorageItem(STORAGE_KEYS.ARTICLES, runtimeArticles);
  }

  return newComment;
}

export async function deleteComment(commentId: string, user?: User | null): Promise<boolean> {
  await delay(300);
  initClientState();

  if (!user) throw new Error("Login required.");

  const commentIndex = runtimeComments.findIndex((c) => c.id === commentId);
  if (commentIndex === -1) throw new Error("Comment not found");

  const comment = runtimeComments[commentIndex];
  // Owner can delete own; Admin & Librarian can delete any comment
  if (comment.userId !== user.id && user.role !== "admin" && user.role !== "librarian") {
    throw new Error("Unauthorized: You do not have permission to delete this comment.");
  }

  const articleId = comment.articleId;
  runtimeComments.splice(commentIndex, 1);
  setStorageItem(STORAGE_KEYS.COMMENTS, runtimeComments);

  // Sync count
  const articleIndex = runtimeArticles.findIndex((a) => a.id === articleId);
  if (articleIndex !== -1) {
    runtimeArticles[articleIndex].commentsCount = Math.max(0, (runtimeArticles[articleIndex].commentsCount || 1) - 1);
    setStorageItem(STORAGE_KEYS.ARTICLES, runtimeArticles);
  }

  return true;
}

// ==========================================
// READING LIST / BOARD API
// ==========================================

export async function getReadingList(userId: string): Promise<ReadingEntry[]> {
  await delay(250);
  initClientState();
  return runtimeReadingList.filter((r) => r.userId === userId);
}

export async function setReadingStatus(
  userId: string,
  bookId: string,
  status: ReadingStatus
): Promise<ReadingEntry> {
  await delay(300);
  initClientState();

  if (!userId) throw new Error("Authentication required.");

  const index = runtimeReadingList.findIndex(
    (r) => r.userId === userId && r.bookId === bookId
  );

  let entry: ReadingEntry;

  if (index !== -1) {
    entry = {
      ...runtimeReadingList[index],
      status,
      updatedAt: new Date().toISOString(),
    };
    runtimeReadingList[index] = entry;
  } else {
    entry = {
      id: `r_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      userId,
      bookId,
      status,
      updatedAt: new Date().toISOString(),
    };
    runtimeReadingList.push(entry);
  }

  setStorageItem(STORAGE_KEYS.READING_LIST, runtimeReadingList);
  return entry;
}

export async function removeFromReadingList(
  userId: string,
  bookId: string
): Promise<boolean> {
  await delay(250);
  initClientState();

  runtimeReadingList = runtimeReadingList.filter(
    (r) => !(r.userId === userId && r.bookId === bookId)
  );
  setStorageItem(STORAGE_KEYS.READING_LIST, runtimeReadingList);
  return true;
}

// ==========================================
// AUTHENTICATION API
// ==========================================

export async function login(email: string, _password?: string): Promise<User> {
  await delay(400);
  initClientState();

  const user = runtimeUsers.find((u) => u.email.toLowerCase() === email.toLowerCase());
  if (!user) {
    throw new Error("No account found with this email. Try demo accounts: amelia@shabdkunj.org, elena@shabdkunj.org, or vikram@shabdkunj.org");
  }

  setStorageItem(STORAGE_KEYS.CURRENT_USER, user);
  return user;
}

export async function signup(name: string, email: string, _password?: string): Promise<User> {
  await delay(450);
  initClientState();

  const existing = runtimeUsers.find((u) => u.email.toLowerCase() === email.toLowerCase());
  if (existing) {
    throw new Error("An account with this email already exists. Please log in.");
  }

  const newUser: User = {
    id: `u_${Date.now()}`,
    name,
    email,
    role: "user",
    avatar: `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80`,
  };

  runtimeUsers.push(newUser);
  setStorageItem(STORAGE_KEYS.USERS, runtimeUsers);
  setStorageItem(STORAGE_KEYS.CURRENT_USER, newUser);
  return newUser;
}

export async function logout(): Promise<void> {
  await delay(200);
  if (typeof window !== "undefined") {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
  }
}

export async function getCurrentUser(): Promise<User | null> {
  await delay(100);
  return getStorageItem<User | null>(STORAGE_KEYS.CURRENT_USER, MOCK_USERS[0]); // default Amelia
}
