package com.shabdkunj.controller;

import com.google.gson.JsonObject;
import com.shabdkunj.dao.BookDao;
import com.shabdkunj.dao.LikeDao;
import com.shabdkunj.model.Book;
import com.shabdkunj.model.User;
import com.shabdkunj.util.Auth;
import com.shabdkunj.util.Ids;
import com.shabdkunj.util.JsonUtil;
import java.io.IOException;
import java.sql.SQLException;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Set;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

public class BookServlet extends HttpServlet {
    private static final Set<String> SORTS = Set.of("latest", "top", "trending");
    private final BookDao books = new BookDao();
    private final LikeDao likes = new LikeDao();

    @Override
    protected void service(HttpServletRequest request, HttpServletResponse response) throws IOException {
        JsonUtil.run(response, () -> route(request, response));
    }

    private void route(HttpServletRequest request, HttpServletResponse response) throws IOException, SQLException {
        String[] parts = JsonUtil.segments(request, "/api/books");
        String method = request.getMethod();
        if (parts.length == 0 && "GET".equals(method)) {
            list(request, response);
            return;
        }
        if (parts.length == 0 && "POST".equals(method)) {
            create(request, response);
            return;
        }
        if (parts.length == 1 && "GET".equals(method)) {
            one(response, Ids.requireId(parts[0], "id"));
            return;
        }
        if (parts.length == 1 && "PUT".equals(method)) {
            update(request, response, Ids.requireId(parts[0], "id"));
            return;
        }
        if (parts.length == 1 && "DELETE".equals(method)) {
            delete(request, response, Ids.requireId(parts[0], "id"));
            return;
        }
        if (parts.length == 2 && "like".equals(parts[1]) && "GET".equals(method)) {
            likeStatus(request, response, Ids.requireId(parts[0], "id"));
            return;
        }
        if (parts.length == 2 && "like".equals(parts[1]) && "POST".equals(method)) {
            toggleLike(request, response, Ids.requireId(parts[0], "id"));
            return;
        }
        if (parts.length > 2 || (parts.length == 2 && !"like".equals(parts[1]))) {
            JsonUtil.writeError(response, HttpServletResponse.SC_NOT_FOUND, "Not found");
            return;
        }
        JsonUtil.writeError(response, HttpServletResponse.SC_METHOD_NOT_ALLOWED, "Method not allowed");
    }

    private void list(HttpServletRequest request, HttpServletResponse response) throws IOException, SQLException {
        String sort = JsonUtil.query(request, "sort");
        if (sort == null) {
            sort = "latest";
        }
        if (!SORTS.contains(sort)) {
            throw new IllegalArgumentException("sort is invalid");
        }
        String search = JsonUtil.query(request, "search");
        if (search != null && search.length() > 200) {
            throw new IllegalArgumentException("search is too long");
        }
        JsonUtil.write(response, HttpServletResponse.SC_OK, books.find(
                JsonUtil.query(request, "genre"),
                search,
                sort,
                JsonUtil.optionalQueryInt(request, "limit")));
    }

    private void one(HttpServletResponse response, String id) throws IOException, SQLException {
        Book book = books.findById(id);
        if (book == null) {
            JsonUtil.writeError(response, HttpServletResponse.SC_NOT_FOUND, "Book not found");
            return;
        }
        JsonUtil.write(response, HttpServletResponse.SC_OK, book);
    }

    private void create(HttpServletRequest request, HttpServletResponse response) throws IOException, SQLException {
        User user = Auth.requireUser(request);
        Auth.requireStaff(user);
        JsonObject body = JsonUtil.readObject(request);
        Book book = books.create(
                user.getId(),
                JsonUtil.text(body, "name", 255, true),
                JsonUtil.text(body, "author", 150, true),
                JsonUtil.text(body, "description", 65535, true),
                JsonUtil.text(body, "coverImage", 500, true),
                JsonUtil.text(body, "genre", 100, true),
                JsonUtil.text(body, "pdfUrl", 500, false),
                JsonUtil.integer(body, "pages", false),
                JsonUtil.integer(body, "publishYear", false),
                JsonUtil.text(body, "openLibraryKey", 100, false),
                JsonUtil.text(body, "iaId", 100, false));
        JsonUtil.write(response, HttpServletResponse.SC_CREATED, book);
    }

    private void update(HttpServletRequest request, HttpServletResponse response, String id)
            throws IOException, SQLException {
        User user = Auth.requireUser(request);
        Auth.requireStaff(user);
        if (books.findById(id) == null) {
            JsonUtil.writeError(response, HttpServletResponse.SC_NOT_FOUND, "Book not found");
            return;
        }
        JsonObject body = JsonUtil.readObject(request);
        Map<String, Object> changes = new LinkedHashMap<>();
        putText(changes, body, "name", 255, true);
        putText(changes, body, "author", 150, true);
        putText(changes, body, "description", 65535, true);
        putText(changes, body, "coverImage", 500, true);
        putText(changes, body, "genre", 100, true);
        putText(changes, body, "pdfUrl", 500, false);
        putText(changes, body, "openLibraryKey", 100, false);
        putText(changes, body, "iaId", 100, false);
        if (body.has("pages")) {
            changes.put("pages", JsonUtil.integer(body, "pages", false));
        }
        if (body.has("publishYear")) {
            changes.put("publishYear", JsonUtil.integer(body, "publishYear", false));
        }
        Book book = books.update(id, changes);
        if (book == null) {
            JsonUtil.writeError(response, HttpServletResponse.SC_NOT_FOUND, "Book not found");
            return;
        }
        JsonUtil.write(response, HttpServletResponse.SC_OK, book);
    }

    private void delete(HttpServletRequest request, HttpServletResponse response, String id)
            throws IOException, SQLException {
        User user = Auth.requireUser(request);
        Auth.requireStaff(user);
        if (!books.delete(id)) {
            JsonUtil.writeError(response, HttpServletResponse.SC_NOT_FOUND, "Book not found");
            return;
        }
        JsonUtil.write(response, HttpServletResponse.SC_OK, true);
    }

    private void likeStatus(HttpServletRequest request, HttpServletResponse response, String id)
            throws IOException, SQLException {
        if (!books.exists(id)) {
            JsonUtil.writeError(response, HttpServletResponse.SC_NOT_FOUND, "Book not found");
            return;
        }
        User user = Auth.optionalUser(request);
        boolean liked = user != null && likes.bookLiked(user.getId(), id);
        JsonUtil.write(response, HttpServletResponse.SC_OK, liked);
    }

    private void toggleLike(HttpServletRequest request, HttpServletResponse response, String id)
            throws IOException, SQLException {
        User user = Auth.requireUser(request);
        Map<String, Object> result = likes.toggleBook(user.getId(), id);
        if (result == null) {
            JsonUtil.writeError(response, HttpServletResponse.SC_NOT_FOUND, "Book not found");
            return;
        }
        JsonUtil.write(response, HttpServletResponse.SC_OK, result);
    }

    private void putText(Map<String, Object> changes, JsonObject body, String field, int maxLength, boolean required) {
        if (!body.has(field)) {
            return;
        }
        changes.put(field, JsonUtil.text(body, field, maxLength, required));
    }
}
