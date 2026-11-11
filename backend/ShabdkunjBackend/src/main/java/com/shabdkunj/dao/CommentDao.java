package com.shabdkunj.dao;

import com.shabdkunj.config.DatabaseConfig;
import com.shabdkunj.model.Comment;
import com.shabdkunj.util.Ids;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;

public class CommentDao {
    public List<Comment> findByArticle(String articleId) throws SQLException {
        String sql = """
                SELECT id, articleId, userId, userName, userAvatar, text, createdAt
                FROM v_comments_full
                WHERE articleId = ?
                ORDER BY createdAt DESC
                """;
        try (Connection connection = DatabaseConfig.getConnection();
                PreparedStatement statement = connection.prepareStatement(sql)) {
            statement.setString(1, articleId);
            try (ResultSet resultSet = statement.executeQuery()) {
                List<Comment> comments = new ArrayList<>();
                while (resultSet.next()) {
                    comments.add(map(resultSet));
                }
                return comments;
            }
        }
    }

    public Comment findById(String id) throws SQLException {
        String sql = """
                SELECT id, articleId, userId, userName, userAvatar, text, createdAt
                FROM v_comments_full
                WHERE id = ?
                """;
        try (Connection connection = DatabaseConfig.getConnection();
                PreparedStatement statement = connection.prepareStatement(sql)) {
            statement.setString(1, id);
            try (ResultSet resultSet = statement.executeQuery()) {
                return resultSet.next() ? map(resultSet) : null;
            }
        }
    }

    public Comment create(String articleId, String userId, String text) throws SQLException {
        String sql = "INSERT INTO comments (id, article_id, user_id, text) VALUES (?, ?, ?, ?)";
        String id = Ids.next("c_");
        try (Connection connection = DatabaseConfig.getConnection();
                PreparedStatement statement = connection.prepareStatement(sql)) {
            statement.setString(1, id);
            statement.setString(2, articleId);
            statement.setString(3, userId);
            statement.setString(4, text);
            statement.executeUpdate();
        }
        return findById(id);
    }

    public boolean delete(String id) throws SQLException {
        String sql = "DELETE FROM comments WHERE id = ?";
        try (Connection connection = DatabaseConfig.getConnection();
                PreparedStatement statement = connection.prepareStatement(sql)) {
            statement.setString(1, id);
            return statement.executeUpdate() > 0;
        }
    }

    private static Comment map(ResultSet resultSet) throws SQLException {
        Comment comment = new Comment();
        comment.setId(resultSet.getString("id"));
        comment.setArticleId(resultSet.getString("articleId"));
        comment.setUserId(resultSet.getString("userId"));
        comment.setUserName(resultSet.getString("userName"));
        comment.setUserAvatar(resultSet.getString("userAvatar"));
        comment.setText(resultSet.getString("text"));
        comment.setCreatedAt(RowMapper.timestamp(resultSet, "createdAt"));
        return comment;
    }
}
