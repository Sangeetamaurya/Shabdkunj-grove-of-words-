package com.shabdkunj.dao;

import com.shabdkunj.config.DatabaseConfig;
import com.shabdkunj.model.Article;
import com.shabdkunj.util.Ids;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Types;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

public class ArticleDao {
    private static final String SELECT_COLUMNS = """
            id, authorId, authorName, authorAvatar, title, subtitle, image, content,
            category, status, likesCount, commentsCount, createdAt, readTime
            """;

    public List<Article> find(String category, String search, String sort, String status, String authorId,
            Integer limit) throws SQLException {
        StringBuilder sql = new StringBuilder("SELECT ").append(SELECT_COLUMNS)
                .append(" FROM v_articles_full WHERE 1 = 1");
        List<Object> params = new ArrayList<>();

        if (status != null) {
            sql.append(" AND status = ?");
            params.add(status);
        }
        if (authorId != null) {
            sql.append(" AND authorId = ?");
            params.add(authorId);
        }
        if (category != null && !category.equalsIgnoreCase("All")) {
            sql.append(" AND LOWER(category) = LOWER(?)");
            params.add(category);
        }
        if (search != null) {
            String pattern = Ids.likePattern(search);
            sql.append("""
                     AND (LOWER(title) LIKE ? ESCAPE '\\\\'
                       OR LOWER(authorName) LIKE ? ESCAPE '\\\\'
                       OR LOWER(COALESCE(subtitle, '')) LIKE ? ESCAPE '\\\\')
                    """);
            params.add(pattern);
            params.add(pattern);
            params.add(pattern);
        }

        if ("top".equals(sort)) {
            sql.append(" ORDER BY likesCount DESC, createdAt DESC");
        } else if ("trending".equals(sort)) {
            sql.append(" ORDER BY (likesCount * 2 + commentsCount * 3) DESC, createdAt DESC");
        } else {
            sql.append(" ORDER BY createdAt DESC");
        }
        if (limit != null) {
            sql.append(" LIMIT ?");
            params.add(limit);
        }

        try (Connection connection = DatabaseConfig.getConnection();
                PreparedStatement statement = connection.prepareStatement(sql.toString())) {
            bind(statement, params);
            try (ResultSet resultSet = statement.executeQuery()) {
                List<Article> articles = new ArrayList<>();
                while (resultSet.next()) {
                    articles.add(map(resultSet));
                }
                return articles;
            }
        }
    }

    public Article findById(String id) throws SQLException {
        String sql = "SELECT " + SELECT_COLUMNS + " FROM v_articles_full WHERE id = ?";
        try (Connection connection = DatabaseConfig.getConnection();
                PreparedStatement statement = connection.prepareStatement(sql)) {
            statement.setString(1, id);
            try (ResultSet resultSet = statement.executeQuery()) {
                return resultSet.next() ? map(resultSet) : null;
            }
        }
    }

    public boolean exists(String id) throws SQLException {
        String sql = "SELECT id FROM articles WHERE id = ?";
        try (Connection connection = DatabaseConfig.getConnection();
                PreparedStatement statement = connection.prepareStatement(sql)) {
            statement.setString(1, id);
            try (ResultSet resultSet = statement.executeQuery()) {
                return resultSet.next();
            }
        }
    }

    public Article create(String authorId, String title, String subtitle, String image, String content,
            String category, String status, String readTime) throws SQLException {
        String sql = """
                INSERT INTO articles
                    (id, author_id, title, subtitle, image, content, category, status,
                     likes_count, comments_count, read_time)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, 0, ?)
                """;
        String id = Ids.next("a_");
        try (Connection connection = DatabaseConfig.getConnection();
                PreparedStatement statement = connection.prepareStatement(sql)) {
            statement.setString(1, id);
            statement.setString(2, authorId);
            statement.setString(3, title);
            setNullableString(statement, 4, subtitle);
            setNullableString(statement, 5, image);
            statement.setString(6, content);
            statement.setString(7, category);
            statement.setString(8, status);
            statement.setString(9, readTime);
            statement.executeUpdate();
        }
        return findById(id);
    }

    public Article update(String id, Map<String, Object> changes) throws SQLException {
        if (changes.isEmpty()) {
            throw new IllegalArgumentException("No fields to update");
        }
        StringBuilder sql = new StringBuilder("UPDATE articles SET ");
        List<Object> params = new ArrayList<>();
        boolean first = true;
        for (Map.Entry<String, Object> change : changes.entrySet()) {
            if (!first) {
                sql.append(", ");
            }
            sql.append(column(change.getKey())).append(" = ?");
            params.add(change.getValue());
            first = false;
        }
        sql.append(" WHERE id = ?");
        params.add(id);

        try (Connection connection = DatabaseConfig.getConnection();
                PreparedStatement statement = connection.prepareStatement(sql.toString())) {
            bind(statement, params);
            if (statement.executeUpdate() == 0) {
                return null;
            }
        }
        return findById(id);
    }

    public boolean delete(String id) throws SQLException {
        String sql = "DELETE FROM articles WHERE id = ?";
        try (Connection connection = DatabaseConfig.getConnection();
                PreparedStatement statement = connection.prepareStatement(sql)) {
            statement.setString(1, id);
            return statement.executeUpdate() > 0;
        }
    }

    private static String column(String field) {
        return switch (field) {
            case "title" -> "title";
            case "subtitle" -> "subtitle";
            case "image" -> "image";
            case "content" -> "content";
            case "category" -> "category";
            case "status" -> "status";
            case "readTime" -> "read_time";
            default -> throw new IllegalArgumentException("Unknown article field");
        };
    }

    private static void bind(PreparedStatement statement, List<Object> params) throws SQLException {
        for (int i = 0; i < params.size(); i++) {
            Object value = params.get(i);
            if (value == null) {
                statement.setNull(i + 1, Types.NULL);
            } else if (value instanceof Integer number) {
                statement.setInt(i + 1, number);
            } else {
                statement.setString(i + 1, value.toString());
            }
        }
    }

    private static void setNullableString(PreparedStatement statement, int index, String value) throws SQLException {
        if (value == null) {
            statement.setNull(index, Types.VARCHAR);
        } else {
            statement.setString(index, value);
        }
    }

    private static Article map(ResultSet resultSet) throws SQLException {
        Article article = new Article();
        article.setId(resultSet.getString("id"));
        article.setAuthorId(resultSet.getString("authorId"));
        article.setAuthorName(resultSet.getString("authorName"));
        article.setAuthorAvatar(resultSet.getString("authorAvatar"));
        article.setTitle(resultSet.getString("title"));
        article.setSubtitle(resultSet.getString("subtitle"));
        article.setImage(resultSet.getString("image"));
        article.setContent(resultSet.getString("content"));
        article.setCategory(resultSet.getString("category"));
        article.setStatus(resultSet.getString("status"));
        article.setLikesCount(resultSet.getInt("likesCount"));
        article.setCommentsCount(resultSet.getInt("commentsCount"));
        article.setCreatedAt(RowMapper.timestamp(resultSet, "createdAt"));
        article.setReadTime(resultSet.getString("readTime"));
        return article;
    }
}
