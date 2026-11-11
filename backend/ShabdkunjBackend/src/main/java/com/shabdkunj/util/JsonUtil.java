package com.shabdkunj.util;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import com.google.gson.JsonSyntaxException;
import com.shabdkunj.config.DatabaseConfig;
import java.io.IOException;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.sql.SQLException;
import java.util.Map;
import java.util.logging.Level;
import java.util.logging.Logger;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

public final class JsonUtil {
    private static final Logger LOGGER = Logger.getLogger(JsonUtil.class.getName());
    private static final Gson GSON = new GsonBuilder().create();

    private JsonUtil() {
    }

    @FunctionalInterface
    public interface ApiAction {
        void run() throws IOException, SQLException;
    }

    public static void run(HttpServletResponse response, ApiAction action) throws IOException {
        try {
            action.run();
        } catch (AuthException exception) {
            writeError(response, exception.getStatus(), exception.getMessage());
        } catch (IllegalArgumentException exception) {
            String message = exception.getMessage() == null ? "Invalid request" : exception.getMessage();
            writeError(response, HttpServletResponse.SC_BAD_REQUEST, message);
        } catch (SQLException exception) {
            LOGGER.log(Level.SEVERE, "Database error", exception);
            if (DatabaseConfig.isConnectionFailure(exception)) {
                writeError(response, HttpServletResponse.SC_SERVICE_UNAVAILABLE, "Database connection failed");
            } else {
                writeError(response, HttpServletResponse.SC_INTERNAL_SERVER_ERROR, "A database error occurred");
            }
        }
    }

    public static void write(HttpServletResponse response, int status, Object body) throws IOException {
        if (response.isCommitted()) {
            return;
        }
        response.setStatus(status);
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");
        response.setHeader("Cache-Control", "no-store");
        GSON.toJson(body, response.getWriter());
    }

    public static void writeError(HttpServletResponse response, int status, String message) throws IOException {
        write(response, status, Map.of("error", message));
    }

    public static JsonObject readObject(HttpServletRequest request) throws IOException {
        try {
            JsonElement element = JsonParser.parseReader(request.getReader());
            if (element == null || element.isJsonNull() || !element.isJsonObject()) {
                throw new IllegalArgumentException("Invalid request");
            }
            return element.getAsJsonObject();
        } catch (JsonSyntaxException exception) {
            throw new IllegalArgumentException("Invalid request");
        }
    }

    public static String text(JsonObject body, String field, int maxLength, boolean required) {
        if (!body.has(field) || body.get(field).isJsonNull()) {
            if (required) {
                throw new IllegalArgumentException(field + " is required");
            }
            return null;
        }
        if (!body.get(field).isJsonPrimitive() || !body.get(field).getAsJsonPrimitive().isString()) {
            throw new IllegalArgumentException(field + " must be a string");
        }
        String value = body.get(field).getAsString().trim();
        if (value.isEmpty()) {
            if (required) {
                throw new IllegalArgumentException(field + " is required");
            }
            return null;
        }
        if (value.length() > maxLength) {
            throw new IllegalArgumentException(field + " is too long");
        }
        return value;
    }

    public static String textAllowEmpty(JsonObject body, String field, int maxLength, boolean required) {
        if (!body.has(field) || body.get(field).isJsonNull()) {
            if (required) {
                throw new IllegalArgumentException(field + " is required");
            }
            return null;
        }
        if (!body.get(field).isJsonPrimitive() || !body.get(field).getAsJsonPrimitive().isString()) {
            throw new IllegalArgumentException(field + " must be a string");
        }
        String value = body.get(field).getAsString();
        if (required && value.trim().isEmpty()) {
            throw new IllegalArgumentException(field + " is required");
        }
        if (value.length() > maxLength) {
            throw new IllegalArgumentException(field + " is too long");
        }
        return value;
    }

    public static Integer integer(JsonObject body, String field, boolean required) {
        if (!body.has(field) || body.get(field).isJsonNull()) {
            if (required) {
                throw new IllegalArgumentException(field + " is required");
            }
            return null;
        }
        JsonElement element = body.get(field);
        if (!element.isJsonPrimitive()) {
            throw new IllegalArgumentException(field + " must be a number");
        }
        try {
            if (element.getAsJsonPrimitive().isNumber()) {
                return element.getAsInt();
            }
            if (element.getAsJsonPrimitive().isString()) {
                String value = element.getAsString().trim();
                if (value.isEmpty()) {
                    if (required) {
                        throw new IllegalArgumentException(field + " is required");
                    }
                    return null;
                }
                return Integer.valueOf(value);
            }
        } catch (NumberFormatException exception) {
            throw new IllegalArgumentException(field + " must be a number");
        }
        throw new IllegalArgumentException(field + " must be a number");
    }

    public static int queryInt(HttpServletRequest request, String name) {
        String raw = request.getParameter(name);
        if (raw == null || raw.isBlank()) {
            throw new IllegalArgumentException(name + " is required");
        }
        try {
            return Integer.parseInt(raw.trim());
        } catch (NumberFormatException exception) {
            throw new IllegalArgumentException(name + " must be a number");
        }
    }

    public static Integer optionalQueryInt(HttpServletRequest request, String name) {
        String raw = request.getParameter(name);
        if (raw == null || raw.isBlank()) {
            return null;
        }
        try {
            int value = Integer.parseInt(raw.trim());
            if (value <= 0 || value > 1000) {
                throw new IllegalArgumentException(name + " is invalid");
            }
            return value;
        } catch (NumberFormatException exception) {
            throw new IllegalArgumentException(name + " must be a number");
        }
    }

    public static String query(HttpServletRequest request, String name) {
        String value = request.getParameter(name);
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    public static String[] segments(HttpServletRequest request, String prefix) {
        String path = request.getRequestURI().substring(request.getContextPath().length());
        path = URLDecoder.decode(path, StandardCharsets.UTF_8);
        if (path.length() > 1 && path.endsWith("/")) {
            path = path.substring(0, path.length() - 1);
        }
        if (!path.startsWith(prefix)) {
            throw new IllegalArgumentException("Invalid request");
        }
        String rest = path.substring(prefix.length());
        if (rest.startsWith("/")) {
            rest = rest.substring(1);
        }
        if (rest.isEmpty()) {
            return new String[0];
        }
        return rest.split("/");
    }

    public static boolean isDuplicate(SQLException exception) {
        SQLException current = exception;
        while (current != null) {
            if (current.getErrorCode() == 1062) {
                return true;
            }
            current = current.getNextException();
        }
        return false;
    }
}
