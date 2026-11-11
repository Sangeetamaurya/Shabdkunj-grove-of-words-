package com.shabdkunj.controller;

import com.shabdkunj.dao.ActivityDao;
import com.shabdkunj.model.User;
import com.shabdkunj.util.Auth;
import com.shabdkunj.util.JsonUtil;
import java.io.IOException;
import java.sql.SQLException;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

public class LibraryServlet extends HttpServlet {
    private final ActivityDao activity = new ActivityDao();

    @Override
    protected void service(HttpServletRequest request, HttpServletResponse response) throws IOException {
        JsonUtil.run(response, () -> {
            if (!"GET".equals(request.getMethod())) {
                JsonUtil.writeError(response, HttpServletResponse.SC_METHOD_NOT_ALLOWED, "Method not allowed");
                return;
            }
            String[] parts = JsonUtil.segments(request, "/api/library");
            if (parts.length != 1 || !"activity".equals(parts[0])) {
                JsonUtil.writeError(response, HttpServletResponse.SC_NOT_FOUND, "Not found");
                return;
            }
            User user = Auth.requireUser(request);
            Auth.requireStaff(user);
            JsonUtil.write(response, HttpServletResponse.SC_OK, activity.libraryActivity());
        });
    }
}
