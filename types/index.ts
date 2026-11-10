export type UserRole = "user" | "admin" | "librarian";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar: string;
}

export type BookGenre =
  | "Fiction"
  | "Science"
  | "Physics"
  | "Love & Romance"
  | "Knowledge"
  | "About Life"
  | "Philosophy"
  | "History"
  | "Mystery & Thriller"
  | "Poetry"
  | "Art & Design"
  | "Technology"
  | "Psychology"
  | "Biography & Memoir"
  | "Classics";

export interface Book {
  id: string;
  name: string;
  author: string;
  description: string;
  coverImage: string;
  genre: BookGenre | string;
  likesCount: number;
  createdAt: string;
  addedBy: string; // userId or system
  pdfUrl?: string; // Optional PDF file or sample link
  pages?: number;
  publishYear?: number | string;
  openLibraryKey?: string;
  iaId?: string; // Internet Archive book ID for reading the entire original book
}

export type ArticleStatus = "draft" | "published";

export type ArticleCategory =
  | "Reading Life"
  | "Culture"
  | "Ideas"
  | "Reviews"
  | "Essays"
  | "Philosophy";

export interface Article {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  title: string;
  subtitle?: string;
  image?: string;
  content: string;
  category: ArticleCategory | string;
  status: ArticleStatus;
  likesCount: number;
  commentsCount?: number;
  createdAt: string;
  readTime?: string;
}

export interface Comment {
  id: string;
  articleId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  text: string;
  createdAt: string;
}

export interface Like {
  id: string;
  userId: string;
  targetType: "book" | "article";
  targetId: string;
  createdAt: string;
}

export type ReadingStatus = "wishlist" | "reading" | "pending" | "done";

export interface ReadingEntry {
  id: string;
  userId: string;
  bookId: string;
  status: ReadingStatus;
  updatedAt?: string;
}

export interface BookFilterParams {
  genre?: string;
  search?: string;
  sort?: "latest" | "top" | "trending";
  limit?: number;
}

export interface ArticleFilterParams {
  category?: string;
  search?: string;
  sort?: "latest" | "top" | "trending";
  status?: ArticleStatus;
  authorId?: string;
  limit?: number;
}
