package com.shabdkunj.dao;

import com.shabdkunj.config.DatabaseConfig;
import com.shabdkunj.model.Book;
import com.shabdkunj.util.Ids;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Types;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

public class BookDao {
    private static final String SELECT_COLUMNS = """
            b.id AS id,
            b.name AS name,
            b.author AS author,
            b.description AS description,
            b.cover_image AS coverImage,
            b.genre AS genre,
            b.likes_count AS likesCount,
            b.created_at AS createdAt,
            b.added_by AS addedBy,
            b.pdf_url AS pdfUrl,
            b.pages AS pages,
            b.publish_year AS publishYear,
            b.open_library_key AS openLibraryKey,
            b.ia_id AS iaId
            """;

    public List<Book> find(String genre, String search, String sort, Integer limit) throws SQLException {
        boolean trending = "trending".equals(sort);
        StringBuilder sql = new StringBuilder();
        List<Object> params = new ArrayList<>();

        if (trending) {
            sql.append("SELECT ").append(SELECT_COLUMNS).append("""
                     FROM books b
                     LEFT JOIN likes l
                       ON l.target_type = 'book'
                      AND l.target_id = b.id
                      AND l.created_at >= (NOW() - INTERVAL 7 DAY)
                     WHERE 1 = 1
                    """);
        } else {
            sql.append("SELECT ").append(SELECT_COLUMNS).append(" FROM books b WHERE 1 = 1");
        }

        appendFilters(sql, params, genre, search);

        if (trending) {
            sql.append(" GROUP BY b.id ORDER BY COUNT(l.id) DESC, b.likes_count DESC");
        } else if ("top".equals(sort)) {
            sql.append(" ORDER BY b.likes_count DESC, b.created_at DESC");
        } else {
            sql.append(" ORDER BY b.created_at DESC");
        }

        if (limit != null) {
            sql.append(" LIMIT ?");
            params.add(limit);
        }

        try (Connection connection = DatabaseConfig.getConnection();
                PreparedStatement statement = connection.prepareStatement(sql.toString())) {
            bind(statement, params);
            try (ResultSet resultSet = statement.executeQuery()) {
                List<Book> books = new ArrayList<>();
                while (resultSet.next()) {
                    books.add(map(resultSet));
                }
                return books;
            }
        }
    }

    public Book findById(String id) throws SQLException {
        String sql = "SELECT " + SELECT_COLUMNS + " FROM books b WHERE b.id = ?";
        try (Connection connection = DatabaseConfig.getConnection();
                PreparedStatement statement = connection.prepareStatement(sql)) {
            statement.setString(1, id);
            try (ResultSet resultSet = statement.executeQuery()) {
                return resultSet.next() ? map(resultSet) : null;
            }
        }
    }

    public boolean exists(String id) throws SQLException {
        String sql = "SELECT id FROM books WHERE id = ?";
        try (Connection connection = DatabaseConfig.getConnection();
                PreparedStatement statement = connection.prepareStatement(sql)) {
            statement.setString(1, id);
            try (ResultSet resultSet = statement.executeQuery()) {
                return resultSet.next();
            }
        }
    }

    public Book create(String addedBy, String name, String author, String description, String coverImage,
            String genre, String pdfUrl, Integer pages, Integer publishYear, String openLibraryKey, String iaId)
            throws SQLException {
        String sql = """
                INSERT INTO books
                    (id, name, author, description, cover_image, genre, likes_count, added_by,
                     pdf_url, pages, publish_year, open_library_key, ia_id)
                VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?, ?, ?)
                """;
        String id = Ids.next("b_");
        try (Connection connection = DatabaseConfig.getConnection();
                PreparedStatement statement = connection.prepareStatement(sql)) {
            statement.setString(1, id);
            statement.setString(2, name);
            statement.setString(3, author);
            statement.setString(4, description);
            statement.setString(5, coverImage);
            statement.setString(6, genre);
            statement.setString(7, addedBy);
            setNullableString(statement, 8, pdfUrl);
            setNullableInt(statement, 9, pages);
            setNullableInt(statement, 10, publishYear);
            setNullableString(statement, 11, openLibraryKey);
            setNullableString(statement, 12, iaId);
            statement.executeUpdate();
        }
        return findById(id);
    }

    public Book update(String id, Map<String, Object> changes) throws SQLException {
        if (changes.isEmpty()) {
            throw new IllegalArgumentException("No fields to update");
        }
        StringBuilder sql = new StringBuilder("UPDATE books SET ");
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
        String sql = "DELETE FROM books WHERE id = ?";
        try (Connection connection = DatabaseConfig.getConnection();
                PreparedStatement statement = connection.prepareStatement(sql)) {
            statement.setString(1, id);
            return statement.executeUpdate() > 0;
        }
    }

    private static void appendFilters(StringBuilder sql, List<Object> params, String genre, String search) {
        if (genre != null && !genre.equalsIgnoreCase("All")) {
            sql.append(" AND LOWER(b.genre) = LOWER(?)");
            params.add(genre);
        }
        if (search != null) {
            String pattern = Ids.likePattern(search);
            sql.append("""
                     AND (LOWER(b.name) LIKE ? ESCAPE '\\\\'
                       OR LOWER(b.author) LIKE ? ESCAPE '\\\\'
                       OR LOWER(b.genre) LIKE ? ESCAPE '\\\\')
                    """);
            params.add(pattern);
            params.add(pattern);
            params.add(pattern);
        }
    }

    private static String column(String field) {
        return switch (field) {
            case "name" -> "name";
            case "author" -> "author";
            case "description" -> "description";
            case "coverImage" -> "cover_image";
            case "genre" -> "genre";
            case "pdfUrl" -> "pdf_url";
            case "pages" -> "pages";
            case "publishYear" -> "publish_year";
            case "openLibraryKey" -> "open_library_key";
            case "iaId" -> "ia_id";
            default -> throw new IllegalArgumentException("Unknown book field");
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

    private static void setNullableInt(PreparedStatement statement, int index, Integer value) throws SQLException {
        if (value == null) {
            statement.setNull(index, Types.INTEGER);
        } else {
            statement.setInt(index, value);
        }
    }

    private static Book map(ResultSet resultSet) throws SQLException {
        Book book = new Book();
        book.setId(resultSet.getString("id"));
        book.setName(resultSet.getString("name"));
        book.setAuthor(resultSet.getString("author"));
        book.setDescription(resultSet.getString("description"));
        book.setCoverImage(resultSet.getString("coverImage"));
        book.setGenre(resultSet.getString("genre"));
        book.setLikesCount(resultSet.getInt("likesCount"));
        book.setCreatedAt(RowMapper.timestamp(resultSet, "createdAt"));
        book.setAddedBy(resultSet.getString("addedBy"));
        book.setPdfUrl(resultSet.getString("pdfUrl"));
        book.setPages(RowMapper.nullableInt(resultSet, "pages"));
        book.setPublishYear(RowMapper.nullableInt(resultSet, "publishYear"));
        book.setOpenLibraryKey(resultSet.getString("openLibraryKey"));
        book.setIaId(resultSet.getString("iaId"));
        return book;
    }
}
