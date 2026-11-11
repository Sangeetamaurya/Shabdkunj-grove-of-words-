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
        activity.put("recentBooks", recentBooks());
        activity.put("recentArticles", recentArticles());
        return activity;
    }

    public Map<String, Object> analytics() throws SQLException {
        Map<String, Object> analytics = libraryActivity();
        analytics.put("readerCount", count("SELECT COUNT(*) FROM users WHERE role = 'user'"));
        analytics.put("librarianCount", count("SELECT COUNT(*) FROM users WHERE role = 'librarian'"));
        analytics.put("adminCount", count("SELECT COUNT(*) FROM users WHERE role = 'admin'"));
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

    private List<Map<String, Object>> recentBooks() throws SQLException {
        String sql = "SELECT id, name, author, genre FROM books ORDER BY created_at DESC LIMIT 5";
        try (Connection connection = DatabaseConfig.getConnection();
                PreparedStatement statement = connection.prepareStatement(sql);
                ResultSet resultSet = statement.executeQuery()) {
            List<Map<String, Object>> rows = new ArrayList<>();
            while (resultSet.next()) {
                Map<String, Object> row = new LinkedHashMap<>();
                row.put("id", resultSet.getString("id"));
                row.put("name", resultSet.getString("name"));
                row.put("author", resultSet.getString("author"));
                row.put("genre", resultSet.getString("genre"));
                rows.add(row);
            }
            return rows;
        }
    }

    private List<Map<String, Object>> recentArticles() throws SQLException {
        String sql = "SELECT id, title, status, authorName FROM v_articles_full ORDER BY createdAt DESC LIMIT 5";
        try (Connection connection = DatabaseConfig.getConnection();
                PreparedStatement statement = connection.prepareStatement(sql);
                ResultSet resultSet = statement.executeQuery()) {
            List<Map<String, Object>> rows = new ArrayList<>();
            while (resultSet.next()) {
                Map<String, Object> row = new LinkedHashMap<>();
                row.put("id", resultSet.getString("id"));
                row.put("title", resultSet.getString("title"));
                row.put("status", resultSet.getString("status"));
                row.put("authorName", resultSet.getString("authorName"));
                rows.add(row);
            }
            return rows;
        }
    }
}
