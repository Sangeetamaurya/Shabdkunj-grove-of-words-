package com.shabdkunj.config;

import java.io.IOException;
import java.io.InputStream;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;
import java.util.Properties;

public final class DatabaseConfig {
    private static final String URL_ENV = "SHABDKUNJ_DB_URL";
    private static final String USER_ENV = "SHABDKUNJ_DB_USER";
    private static final String PASSWORD_ENV = "SHABDKUNJ_DB_PASSWORD";

    private DatabaseConfig() {
    }

    public static Connection getConnection() throws SQLException {
        Properties settings = loadSettings();
        String url = firstNonBlank(System.getenv(URL_ENV), settings.getProperty("db.url"));
        String user = firstNonBlank(System.getenv(USER_ENV), settings.getProperty("db.user"));
        String password = firstPresent(System.getenv(PASSWORD_ENV), settings.getProperty("db.password"));

        if (url == null || user == null || password == null) {
            throw new SQLException(
                    "Database is not configured. Set SHABDKUNJ_DB_URL, SHABDKUNJ_DB_USER, and SHABDKUNJ_DB_PASSWORD.",
                    "08001");
        }

        try {
            Class.forName("com.mysql.cj.jdbc.Driver");
        } catch (ClassNotFoundException exception) {
            SQLException missingDriver = new SQLException("MySQL JDBC driver is not available", "08001");
            missingDriver.initCause(exception);
            throw missingDriver;
        }

        try {
            return DriverManager.getConnection(url, user, password);
        } catch (SQLException exception) {
            if (isConnectionFailure(exception)) {
                throw exception;
            }
            SQLException wrapped = new SQLException("Database connection failed", "08001");
            wrapped.initCause(exception);
            throw wrapped;
        }
    }

    public static boolean isConnectionFailure(SQLException exception) {
        SQLException current = exception;
        while (current != null) {
            String state = current.getSQLState();
            if (state != null && state.startsWith("08")) {
                return true;
            }
            String type = current.getClass().getName();
            if (type.contains("CommunicationsException") || type.contains("CJCommunicationsException")) {
                return true;
            }
            current = current.getNextException();
        }
        Throwable cause = exception;
        while (cause != null) {
            String type = cause.getClass().getName();
            if (type.contains("CommunicationsException") || type.contains("ConnectException")) {
                return true;
            }
            cause = cause.getCause();
        }
        return false;
    }

    private static Properties loadSettings() {
        Properties properties = new Properties();
        try (InputStream input = DatabaseConfig.class.getClassLoader().getResourceAsStream("db.properties")) {
            if (input != null) {
                properties.load(input);
            }
        } catch (IOException exception) {
            throw new IllegalStateException("Could not read db.properties", exception);
        }
        return properties;
    }

    private static String firstNonBlank(String preferred, String fallback) {
        if (preferred != null && !preferred.isBlank()) {
            return preferred.trim();
        }
        if (fallback != null && !fallback.isBlank()) {
            return fallback.trim();
        }
        return null;
    }

    private static String firstPresent(String preferred, String fallback) {
        if (preferred != null) {
            return preferred;
        }
        return fallback;
    }
}
