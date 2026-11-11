package com.shabdkunj.dao;

import com.shabdkunj.config.DatabaseConfig;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

public class ActivityDao {
    public Map<String, Object> libraryActivity() throws SQLException {
        Map<String, Object> activity = new LinkedHashMap<>();
        activity.put("bookCount", count("SELECT COUNT(*) FROM books"));
        activity.put("publishedArticleCount", count("SELECT COUNT(*) FROM articles WHERE status = 'published'"));
        activity.put("draftArticleCount", count("SELECT COUNT(*) FROM articles WHERE status = 'draft'"));
        activity.put("commentCount", count("SELECT COUNT(*) FROM comments"));
        activity.put("userCount", count("SELECT COUNT(*) FROM users WHERE id <> 'system'"));
        activity.put("events", recentEvents());
        return activity;
    }

    public Map<String, Object> analytics() throws SQLException {
        Map<String, Object> analytics = new LinkedHashMap<>();
        analytics.put("userCount", count("SELECT COUNT(*) FROM users WHERE id <> 'system'"));
        analytics.put("readerCount", count("SELECT COUNT(*) FROM users WHERE role = 'user' AND id <> 'system'"));
        analytics.put("librarianCount", count("SELECT COUNT(*) FROM users WHERE role = 'librarian'"));
        analytics.put("adminCount", count("SELECT COUNT(*) FROM users WHERE role = 'admin'"));
        analytics.put("bookCount", count("SELECT COUNT(*) FROM books"));
        analytics.put("articleCount", count("SELECT COUNT(*) FROM articles"));
        analytics.put("publishedArticleCount", count("SELECT COUNT(*) FROM articles WHERE status = 'published'"));
        analytics.put("draftArticleCount", count("SELECT COUNT(*) FROM articles WHERE status = 'draft'"));
        analytics.put("commentCount", count("SELECT COUNT(*) FROM comments"));
        analytics.put("likeCount", count("SELECT COUNT(*) FROM likes"));
        analytics.put("readingEntryCount", count("SELECT COUNT(*) FROM reading_list"));
        return analytics;
    }

    private int count(String sql) throws SQLException {
        try (Connection connection = DatabaseConfig.getConnection();
                PreparedStatement statement = connection.prepareStatement(sql);
                ResultSet resultSet = statement.executeQuery()) {
            return resultSet.next() ? resultSet.getInt(1) : 0;
        }
    }

    private List<Map<String, Object>> recentEvents() throws SQLException {
        String sql = """
                SELECT * FROM (
                    SELECT 'user_registered' AS eventType,
                           CONCAT('New ', CASE role WHEN 'librarian' THEN 'librarian' WHEN 'admin' THEN 'admin' ELSE 'reader' END, ' registered: ', name) AS description,
                           created_at AS occurredAt
                    FROM users
                    WHERE id <> 'system'
                    UNION ALL
                    SELECT 'book_added' AS eventType,
                           CONCAT('Book added: ', b.name, ' by ', b.author) AS description,
                           b.created_at AS occurredAt
                    FROM books b
                    UNION ALL
                    SELECT 'article_published' AS eventType,
                           CONCAT('Article published: ', a.title, ' by ', u.name) AS description,
                           a.created_at AS occurredAt
                    FROM articles a
                    JOIN users u ON a.author_id = u.id
                    WHERE a.status = 'published'
                ) AS events
                ORDER BY occurredAt DESC
                LIMIT 20
                """;
        try (Connection connection = DatabaseConfig.getConnection();
                PreparedStatement statement = connection.prepareStatement(sql);
                ResultSet resultSet = statement.executeQuery()) {
            List<Map<String, Object>> rows = new ArrayList<>();
            while (resultSet.next()) {
                Map<String, Object> row = new LinkedHashMap<>();
                row.put("eventType", resultSet.getString("eventType"));
                row.put("description", resultSet.getString("description"));
                row.put("occurredAt", RowMapper.timestamp(resultSet, "occurredAt"));
                rows.add(row);
            }
            return rows;
        }
    }
}
