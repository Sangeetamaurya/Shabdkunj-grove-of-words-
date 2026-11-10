-- ============================================================================
-- SHABDKUNJ - BACKEND API SQL QUERIES (1:1 Match with lib/api.ts functions)
-- ============================================================================

USE shabdkunj_db;

-- 1. getBooks() - Search by name, author, OR genre (Matches api.ts line 112)
SELECT * FROM books
WHERE LOWER(name) LIKE LOWER('%physics%')
   OR LOWER(author) LIKE LOWER('%physics%')
   OR LOWER(genre) LIKE LOWER('%physics%')
ORDER BY created_at DESC;

-- 2. getBooks({ sort: 'top', limit: 15 }) - Top 15 Books
SELECT * FROM books
ORDER BY likes_count DESC
LIMIT 15;

-- 3. getBooks({ sort: 'trending', limit: 15 }) - Trending Books (Last 7 Days)
SELECT b.*, COUNT(l.id) AS recent_7d_likes
FROM books b
LEFT JOIN likes l 
  ON l.target_type = 'book' 
  AND l.target_id = b.id 
  AND l.created_at >= NOW() - INTERVAL 7 DAY
GROUP BY b.id
ORDER BY recent_7d_likes DESC, b.likes_count DESC
LIMIT 15;

-- 4. getArticles() - Search by title, authorName, OR subtitle (api.ts line 284)
SELECT * FROM v_articles_full
WHERE status = 'published'
  AND (
    LOWER(title) LIKE LOWER('%quiet%')
    OR LOWER(authorName) LIKE LOWER('%quiet%')
    OR LOWER(COALESCE(subtitle, '')) LIKE LOWER('%quiet%')
  )
ORDER BY createdAt DESC;

-- 5. getArticles({ sort: 'trending' }) - Matches api.ts line 297 formula
SELECT *, (likesCount * 2 + commentsCount * 3) AS trending_score
FROM v_articles_full
WHERE status = 'published'
ORDER BY trending_score DESC;

-- 6. getComments(articleId) - Uses v_comments_full view
SELECT * FROM v_comments_full
WHERE articleId = 'a1'
ORDER BY createdAt ASC;

-- 7. setReadingStatus(userId, bookId, status) - Drag & Drop Upsert
INSERT INTO reading_list (id, user_id, book_id, status)
VALUES ('r_new', 'u1', 'b2', 'reading')
ON DUPLICATE KEY UPDATE 
    status = VALUES(status),
    updated_at = CURRENT_TIMESTAMP;