package com.shabdkunj.dao;

import com.shabdkunj.config.DatabaseConfig;
import com.shabdkunj.model.User;
import com.shabdkunj.util.Auth;
import com.shabdkunj.util.Ids;
import com.shabdkunj.util.PasswordUtil;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;

public class UserDao {
    private static final String COLUMNS = "id, name, email, password_hash, role, avatar, created_at";
    private static final String PUBLIC_COLUMNS = "id, name, email, role, avatar, created_at";
    private static final String SIGNUP_AVATAR =
            "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80";

    public User findById(String id) throws SQLException {
        String sql = "SELECT " + COLUMNS + " FROM users WHERE id = ?";
        try (Connection connection = DatabaseConfig.getConnection();
                PreparedStatement statement = connection.prepareStatement(sql)) {
            statement.setString(1, id);
            try (ResultSet resultSet = statement.executeQuery()) {
                return resultSet.next() ? map(resultSet) : null;
            }
        }
    }

    public User findByEmail(String email) throws SQLException {
        String sql = "SELECT " + COLUMNS + " FROM users WHERE LOWER(email) = LOWER(?)";
        try (Connection connection = DatabaseConfig.getConnection();
                PreparedStatement statement = connection.prepareStatement(sql)) {
            statement.setString(1, email);
            try (ResultSet resultSet = statement.executeQuery()) {
                return resultSet.next() ? map(resultSet) : null;
            }
        }
    }

    public User create(String name, String email, String password) throws SQLException {
        String sql = "INSERT INTO users (id, name, email, password_hash, role, avatar) VALUES (?, ?, ?, ?, ?, ?)";
        String id = Ids.next("u_");
        try (Connection connection = DatabaseConfig.getConnection();
                PreparedStatement statement = connection.prepareStatement(sql)) {
            statement.setString(1, id);
            statement.setString(2, name);
            statement.setString(3, email);
            statement.setString(4, PasswordUtil.hash(password));
            statement.setString(5, Auth.ROLE_USER);
            statement.setString(6, SIGNUP_AVATAR);
            statement.executeUpdate();
        }
        return findById(id);
    }

    public List<User> listReadersAndLibrarians() throws SQLException {
        String sql = "SELECT " + PUBLIC_COLUMNS + " FROM users "
                + "WHERE role IN ('user', 'librarian') AND id <> 'system' "
                + "ORDER BY created_at DESC, name ASC";
        try (Connection connection = DatabaseConfig.getConnection();
                PreparedStatement statement = connection.prepareStatement(sql);
                ResultSet resultSet = statement.executeQuery()) {
            List<User> users = new ArrayList<>();
            while (resultSet.next()) {
                users.add(mapPublic(resultSet));
            }
            return users;
        }
    }

    public boolean updateRole(String id, String role) throws SQLException {
        String sql = "UPDATE users SET role = ? WHERE id = ? AND role <> 'admin' AND id <> 'system'";
        try (Connection connection = DatabaseConfig.getConnection();
                PreparedStatement statement = connection.prepareStatement(sql)) {
            statement.setString(1, role);
            statement.setString(2, id);
            return statement.executeUpdate() > 0;
        }
    }

    private User map(ResultSet resultSet) throws SQLException {
        User user = new User();
        user.setId(resultSet.getString("id"));
        user.setName(resultSet.getString("name"));
        user.setEmail(resultSet.getString("email"));
        user.setPasswordHash(resultSet.getString("password_hash"));
        user.setRole(resultSet.getString("role"));
        user.setAvatar(resultSet.getString("avatar"));
        user.setCreatedAt(RowMapper.timestamp(resultSet, "created_at"));
        return user;
    }

    private User mapPublic(ResultSet resultSet) throws SQLException {
        User user = new User();
        user.setId(resultSet.getString("id"));
        user.setName(resultSet.getString("name"));
        user.setEmail(resultSet.getString("email"));
        user.setRole(resultSet.getString("role"));
        user.setAvatar(resultSet.getString("avatar"));
        user.setCreatedAt(RowMapper.timestamp(resultSet, "created_at"));
        return user;
    }
}
