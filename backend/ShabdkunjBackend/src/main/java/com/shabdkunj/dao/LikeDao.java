package com.shabdkunj.dao;

import com.shabdkunj.config.DatabaseConfig;
import com.shabdkunj.util.Ids;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.LinkedHashMap;
import java.util.Map;

public class LikeDao {
    public Map<String, Object> toggleBook(String userId, String bookId) throws SQLException {
        return toggle(userId, "book", "books", bookId);
    }

    public Map<String, Object> toggleArticle(String userId, String articleId) throws SQLException {
        return toggle(userId, "article", "articles", articleId);
    }

    public boolean bookLiked(String userId, String bookId) throws SQLException {
        return liked(userId, "book", bookId);
    }

    public boolean articleLiked(String userId, String articleId) throws SQLException {
        return liked(userId, "article", articleId);
    }

    private Map<String, Object> toggle(String userId, String targetType, String table, String targetId)
            throws SQLException {
        try (Connection connection = DatabaseConfig.getConnection()) {
            connection.setAutoCommit(false);
            try {
                Integer currentCount = lockCount(connection, table, targetId);
                if (currentCount == null) {
                    connection.rollback();
                    return null;
                }

                String likeId = findLikeId(connection, userId, targetType, targetId);
                boolean liked;
                int likesCount;
                if (likeId != null) {
                    deleteLike(connection, likeId);
                    likesCount = Math.max(0, currentCount - 1);
                    liked = false;
                } else {
                    insertLike(connection, userId, targetType, targetId);
                    likesCount = currentCount + 1;
                    liked = true;
                }
                updateCount(connection, table, targetId, likesCount);
                connection.commit();

                Map<String, Object> result = new LinkedHashMap<>();
                result.put("liked", liked);
                result.put("likesCount", likesCount);
                return result;
            } catch (SQLException exception) {
                rollback(connection, exception);
                throw exception;
            } catch (RuntimeException exception) {
                rollback(connection, exception);
                throw exception;
            } finally {
                connection.setAutoCommit(true);
            }
        }
    }

    private boolean liked(String userId, String targetType, String targetId) throws SQLException {
        String sql = "SELECT id FROM likes WHERE user_id = ? AND target_type = ? AND target_id = ?";
        try (Connection connection = DatabaseConfig.getConnection();
                PreparedStatement statement = connection.prepareStatement(sql)) {
            statement.setString(1, userId);
            statement.setString(2, targetType);
            statement.setString(3, targetId);
            try (ResultSet resultSet = statement.executeQuery()) {
                return resultSet.next();
            }
        }
    }

    private Integer lockCount(Connection connection, String table, String targetId) throws SQLException {
        String sql = "SELECT likes_count FROM " + table + " WHERE id = ? FOR UPDATE";
        try (PreparedStatement statement = connection.prepareStatement(sql)) {
            statement.setString(1, targetId);
            try (ResultSet resultSet = statement.executeQuery()) {
                if (!resultSet.next()) {
                    return null;
                }
                return resultSet.getInt("likes_count");
            }
        }
    }

    private String findLikeId(Connection connection, String userId, String targetType, String targetId)
            throws SQLException {
        String sql = """
                SELECT id FROM likes
                WHERE user_id = ? AND target_type = ? AND target_id = ?
                FOR UPDATE
                """;
        try (PreparedStatement statement = connection.prepareStatement(sql)) {
            statement.setString(1, userId);
            statement.setString(2, targetType);
            statement.setString(3, targetId);
            try (ResultSet resultSet = statement.executeQuery()) {
                return resultSet.next() ? resultSet.getString("id") : null;
            }
        }
    }

    private void deleteLike(Connection connection, String likeId) throws SQLException {
        String sql = "DELETE FROM likes WHERE id = ?";
        try (PreparedStatement statement = connection.prepareStatement(sql)) {
            statement.setString(1, likeId);
            statement.executeUpdate();
        }
    }

    private void insertLike(Connection connection, String userId, String targetType, String targetId)
            throws SQLException {
        String sql = "INSERT INTO likes (id, user_id, target_type, target_id) VALUES (?, ?, ?, ?)";
        try (PreparedStatement statement = connection.prepareStatement(sql)) {
            statement.setString(1, Ids.next("l_"));
            statement.setString(2, userId);
            statement.setString(3, targetType);
            statement.setString(4, targetId);
            statement.executeUpdate();
        }
    }

    private void updateCount(Connection connection, String table, String targetId, int likesCount)
            throws SQLException {
        String sql = "UPDATE " + table + " SET likes_count = ? WHERE id = ?";
        try (PreparedStatement statement = connection.prepareStatement(sql)) {
            statement.setInt(1, likesCount);
            statement.setString(2, targetId);
            statement.executeUpdate();
        }
    }

    private void rollback(Connection connection, Exception exception) {
        try {
            connection.rollback();
        } catch (SQLException rollback) {
            exception.addSuppressed(rollback);
        }
    }
}
