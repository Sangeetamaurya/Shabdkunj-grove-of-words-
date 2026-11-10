-- ============================================================================
-- SHABDKUNJ (Grove of Words) - COMPLETE DATABASE SCHEMA
-- 100% Synced with types/index.ts, lib/api.ts, lib/open-library.ts & PDF Spec
-- ============================================================================

CREATE DATABASE IF NOT EXISTS shabdkunj_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE shabdkunj_db;

-- Drop existing views and tables cleanly if re-running
DROP VIEW IF EXISTS v_articles_full;
DROP VIEW IF EXISTS v_comments_full;
DROP VIEW IF EXISTS v_reading_board_full;

DROP TABLE IF EXISTS reading_list;
DROP TABLE IF EXISTS likes;
DROP TABLE IF EXISTS comments;
DROP TABLE IF EXISTS articles;
DROP TABLE IF EXISTS books;
DROP TABLE IF EXISTS users;

-- ----------------------------------------------------------------------------
-- 1. USERS TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE users (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('user', 'librarian', 'admin') NOT NULL DEFAULT 'user',
    avatar VARCHAR(500) DEFAULT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------------------
-- 2. BOOKS TABLE
-- Matches Book interface in types/index.ts + open-library.ts
-- ----------------------------------------------------------------------------
CREATE TABLE books (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    author VARCHAR(150) NOT NULL,
    description TEXT NOT NULL,
    cover_image VARCHAR(500) NOT NULL,
    genre VARCHAR(100) NOT NULL,
    likes_count INT NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    added_by VARCHAR(50) DEFAULT 'system',
    pdf_url VARCHAR(500) DEFAULT NULL,
    pages INT DEFAULT NULL,
    publish_year INT DEFAULT NULL,
    open_library_key VARCHAR(100) DEFAULT NULL,
    ia_id VARCHAR(100) DEFAULT NULL,
    FOREIGN KEY (added_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_books_genre (genre),
    INDEX idx_books_likes (likes_count DESC),
    INDEX idx_books_created (created_at DESC)
);

-- ----------------------------------------------------------------------------
-- 3. ARTICLES TABLE
-- Matches Article interface in types/index.ts
-- ----------------------------------------------------------------------------
CREATE TABLE articles (
    id VARCHAR(50) PRIMARY KEY,
    author_id VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    subtitle VARCHAR(500) DEFAULT NULL,
    image VARCHAR(500) DEFAULT NULL,
    content LONGTEXT NOT NULL,
    category VARCHAR(100) NOT NULL,
    status ENUM('draft', 'published') NOT NULL DEFAULT 'draft',
    likes_count INT NOT NULL DEFAULT 0,
    comments_count INT NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    read_time VARCHAR(50) DEFAULT '5 min read',
    FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_articles_status_date (status, created_at DESC),
    INDEX idx_articles_category (category),
    INDEX idx_articles_author (author_id),
    INDEX idx_articles_likes (likes_count DESC)
);

-- ----------------------------------------------------------------------------
-- 4. COMMENTS TABLE
-- Matches Comment interface in types/index.ts
-- ----------------------------------------------------------------------------
CREATE TABLE comments (
    id VARCHAR(50) PRIMARY KEY,
    article_id VARCHAR(50) NOT NULL,
    user_id VARCHAR(50) NOT NULL,
    text TEXT NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_comments_article (article_id, created_at ASC)
);

-- ----------------------------------------------------------------------------
-- 5. LIKES TABLE
-- Matches Like interface in types/index.ts
-- ----------------------------------------------------------------------------
CREATE TABLE likes (
    id VARCHAR(50) PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL,
    target_type ENUM('book', 'article') NOT NULL,
    target_id VARCHAR(50) NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY uk_user_target_like (user_id, target_type, target_id),
    INDEX idx_likes_trending (target_type, created_at, target_id)
);

-- ----------------------------------------------------------------------------
-- 6. READING LIST (READING BOARD) TABLE
-- Matches ReadingEntry interface in types/index.ts
-- ----------------------------------------------------------------------------
CREATE TABLE reading_list (
    id VARCHAR(50) PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL,
    book_id VARCHAR(50) NOT NULL,
    status ENUM('wishlist', 'reading', 'pending', 'done') NOT NULL DEFAULT 'wishlist',
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE,
    UNIQUE KEY uk_user_book_board (user_id, book_id),
    INDEX idx_reading_user_status (user_id, status)
);

-- ============================================================================
-- HELPFUL VIEWS FOR BACKEND & FRONTEND (Auto-joins authorName & userAvatar)
-- ============================================================================

CREATE VIEW v_articles_full AS
SELECT 
    a.id,
    a.author_id AS authorId,
    u.name AS authorName,
    u.avatar AS authorAvatar,
    a.title,
    a.subtitle,
    a.image,
    a.content,
    a.category,
    a.status,
    a.likes_count AS likesCount,
    a.comments_count AS commentsCount,
    a.created_at AS createdAt,
    a.read_time AS readTime
FROM articles a
JOIN users u ON a.author_id = u.id;

CREATE VIEW v_comments_full AS
SELECT 
    c.id,
    c.article_id AS articleId,
    c.user_id AS userId,
    u.name AS userName,
    u.avatar AS userAvatar,
    c.text,
    c.created_at AS createdAt
FROM comments c
JOIN users u ON c.user_id = u.id;

CREATE VIEW v_reading_board_full AS
SELECT 
    r.id,
    r.user_id AS userId,
    r.book_id AS bookId,
    r.status,
    r.updated_at AS updatedAt,
    b.name AS bookName,
    b.author AS bookAuthor,
    b.cover_image AS coverImage,
    b.genre
FROM reading_list r
JOIN books b ON r.book_id = b.id;

-- ============================================================================
-- AUTOMATIC TRIGGERS (Keeps likes_count and comments_count in sync!)
-- ============================================================================

DELIMITER //

CREATE TRIGGER trg_after_comment_insert
AFTER INSERT ON comments
FOR EACH ROW
BEGIN
    UPDATE articles 
    SET comments_count = comments_count + 1 
    WHERE id = NEW.article_id;
END //

CREATE TRIGGER trg_after_comment_delete
AFTER DELETE ON comments
FOR EACH ROW
BEGIN
    UPDATE articles 
    SET comments_count = GREATEST(0, comments_count - 1) 
    WHERE id = OLD.article_id;
END //

CREATE TRIGGER trg_after_book_delete
AFTER DELETE ON books
FOR EACH ROW
BEGIN
    DELETE FROM likes WHERE target_type = 'book' AND target_id = OLD.id;
END //

CREATE TRIGGER trg_after_article_delete
AFTER DELETE ON articles
FOR EACH ROW
BEGIN
    DELETE FROM likes WHERE target_type = 'article' AND target_id = OLD.id;
END //

DELIMITER ;