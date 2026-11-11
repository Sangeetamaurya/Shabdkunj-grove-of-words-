package com.shabdkunj.dao;

import com.shabdkunj.config.DatabaseConfig;
import com.shabdkunj.model.ReadingEntry;
import com.shabdkunj.util.Ids;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;

public class ReadingListDao {
    public static final Set<String> STATUSES = Set.of("wishlist", "reading", "pending", "done");

    private static final String SELECT_COLUMNS = """
            id, userId, bookId, status, updatedAt, bookName, bookAuthor, coverImage, genre
            """;

    public List<ReadingEntry> findByUser(String userId) throws SQLException {
        String sql = "SELECT " + SELECT_COLUMNS + " FROM v_reading_board_full WHERE userId = ? ORDER BY updatedAt DESC";
        try (Connection connection = DatabaseConfig.getConnection();
                PreparedStatement statement = connection.prepareStatement(sql)) {
            statement.setString(1, userId);
            try (ResultSet resultSet = statement.executeQuery()) {
                List<ReadingEntry> entries = new ArrayList<>();
                while (resultSet.next()) {
                    entries.add(map(resultSet));
                }
                return entries;
            }
        }
    }

    public ReadingEntry save(String userId, String bookId, String status) throws SQLException {
        if (!STATUSES.contains(status)) {
            throw new IllegalArgumentException("status is invalid");
        }
        String sql = """
                INSERT INTO reading_list (id, user_id, book_id, status)
                VALUES (?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE status = VALUES(status), updated_at = CURRENT_TIMESTAMP
                """;
        try (Connection connection = DatabaseConfig.getConnection();
                PreparedStatement statement = connection.prepareStatement(sql)) {
            statement.setString(1, Ids.next("r_"));
            statement.setString(2, userId);
            statement.setString(3, bookId);
            statement.setString(4, status);
            statement.executeUpdate();
        }
        return findOne(userId, bookId);
    }

    public boolean delete(String userId, String bookId) throws SQLException {
        String sql = "DELETE FROM reading_list WHERE user_id = ? AND book_id = ?";
        try (Connection connection = DatabaseConfig.getConnection();
                PreparedStatement statement = connection.prepareStatement(sql)) {
            statement.setString(1, userId);
            statement.setString(2, bookId);
            return statement.executeUpdate() > 0;
        }
    }

    private ReadingEntry findOne(String userId, String bookId) throws SQLException {
        String sql = "SELECT " + SELECT_COLUMNS + " FROM v_reading_board_full WHERE userId = ? AND bookId = ?";
        try (Connection connection = DatabaseConfig.getConnection();
                PreparedStatement statement = connection.prepareStatement(sql)) {
            statement.setString(1, userId);
            statement.setString(2, bookId);
            try (ResultSet resultSet = statement.executeQuery()) {
                return resultSet.next() ? map(resultSet) : null;
            }
        }
    }

    private static ReadingEntry map(ResultSet resultSet) throws SQLException {
        ReadingEntry entry = new ReadingEntry();
        entry.setId(resultSet.getString("id"));
        entry.setUserId(resultSet.getString("userId"));
        entry.setBookId(resultSet.getString("bookId"));
        entry.setStatus(resultSet.getString("status"));
        entry.setUpdatedAt(RowMapper.timestamp(resultSet, "updatedAt"));
        entry.setBookName(resultSet.getString("bookName"));
        entry.setBookAuthor(resultSet.getString("bookAuthor"));
        entry.setCoverImage(resultSet.getString("coverImage"));
        entry.setGenre(resultSet.getString("genre"));
        return entry;
    }
}
