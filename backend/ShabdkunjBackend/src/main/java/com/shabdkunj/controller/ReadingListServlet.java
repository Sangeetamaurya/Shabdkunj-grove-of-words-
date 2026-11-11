package com.shabdkunj.controller;

import com.google.gson.JsonObject;
import com.shabdkunj.dao.BookDao;
import com.shabdkunj.dao.ReadingListDao;
import com.shabdkunj.model.ReadingEntry;
import com.shabdkunj.model.User;
import com.shabdkunj.util.Auth;
import com.shabdkunj.util.Ids;
import com.shabdkunj.util.JsonUtil;
import java.io.IOException;
import java.sql.SQLException;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

public class ReadingListServlet extends HttpServlet {
    private final ReadingListDao readingList = new ReadingListDao();
    private final BookDao books = new BookDao();

    @Override
    protected void service(HttpServletRequest request, HttpServletResponse response) throws IOException {
        JsonUtil.run(response, () -> route(request, response));
    }

    private void route(HttpServletRequest request, HttpServletResponse response) throws IOException, SQLException {
        String[] parts = JsonUtil.segments(request, "/api/reading");
        if (parts.length != 0) {
            JsonUtil.writeError(response, HttpServletResponse.SC_NOT_FOUND, "Not found");
            return;
        }
        User user = Auth.requireUser(request);
        switch (request.getMethod()) {
            case "GET" -> JsonUtil.write(response, HttpServletResponse.SC_OK, readingList.findByUser(user.getId()));
            case "PUT" -> save(request, response, user);
            case "DELETE" -> remove(request, response, user);
            default -> JsonUtil.writeError(response, HttpServletResponse.SC_METHOD_NOT_ALLOWED, "Method not allowed");
        }
    }

    private void save(HttpServletRequest request, HttpServletResponse response, User user)
            throws IOException, SQLException {
        JsonObject body = JsonUtil.readObject(request);
        String bookId = Ids.requireId(JsonUtil.text(body, "bookId", 50, true), "bookId");
        String status = JsonUtil.text(body, "status", 20, true);
        if (!ReadingListDao.STATUSES.contains(status)) {
            throw new IllegalArgumentException("status is invalid");
        }
        if (!books.exists(bookId)) {
            JsonUtil.writeError(response, HttpServletResponse.SC_NOT_FOUND, "Book not found");
            return;
        }
        ReadingEntry entry = readingList.save(user.getId(), bookId, status);
        JsonUtil.write(response, HttpServletResponse.SC_OK, entry);
    }

    private void remove(HttpServletRequest request, HttpServletResponse response, User user)
            throws IOException, SQLException {
        String bookId = Ids.requireId(JsonUtil.query(request, "bookId"), "bookId");
        if (!readingList.delete(user.getId(), bookId)) {
            JsonUtil.writeError(response, HttpServletResponse.SC_NOT_FOUND, "Reading entry not found");
            return;
        }
        JsonUtil.write(response, HttpServletResponse.SC_OK, true);
    }
}
