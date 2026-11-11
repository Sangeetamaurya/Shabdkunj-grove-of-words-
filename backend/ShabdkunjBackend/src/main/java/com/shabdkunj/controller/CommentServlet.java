package com.shabdkunj.controller;

import com.shabdkunj.dao.CommentDao;
import com.shabdkunj.model.Comment;
import com.shabdkunj.model.User;
import com.shabdkunj.util.Auth;
import com.shabdkunj.util.AuthException;
import com.shabdkunj.util.Ids;
import com.shabdkunj.util.JsonUtil;
import java.io.IOException;
import java.sql.SQLException;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

public class CommentServlet extends HttpServlet {
    private final CommentDao comments = new CommentDao();

    @Override
    protected void service(HttpServletRequest request, HttpServletResponse response) throws IOException {
        JsonUtil.run(response, () -> route(request, response));
    }

    private void route(HttpServletRequest request, HttpServletResponse response) throws IOException, SQLException {
        String[] parts = JsonUtil.segments(request, "/api/comments");
        if (parts.length != 1) {
            JsonUtil.writeError(response, HttpServletResponse.SC_NOT_FOUND, "Not found");
            return;
        }
        if (!"DELETE".equals(request.getMethod())) {
            JsonUtil.writeError(response, HttpServletResponse.SC_METHOD_NOT_ALLOWED, "Method not allowed");
            return;
        }
        String id = Ids.requireId(parts[0], "id");
        User user = Auth.requireUser(request);
        Comment comment = comments.findById(id);
        if (comment == null) {
            JsonUtil.writeError(response, HttpServletResponse.SC_NOT_FOUND, "Comment not found");
            return;
        }
        if (!user.getId().equals(comment.getUserId()) && !Auth.isStaff(user)) {
            throw new AuthException(HttpServletResponse.SC_FORBIDDEN,
                    "Unauthorized: You do not have permission to delete this comment.");
        }
        comments.delete(id);
        JsonUtil.write(response, HttpServletResponse.SC_OK, true);
    }
}
