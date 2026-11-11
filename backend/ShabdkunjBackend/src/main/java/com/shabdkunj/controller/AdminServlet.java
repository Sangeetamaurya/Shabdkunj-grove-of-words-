package com.shabdkunj.controller;

import com.google.gson.JsonObject;
import com.shabdkunj.config.SiteSettings;
import com.shabdkunj.dao.ActivityDao;
import com.shabdkunj.dao.UserDao;
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

public class AdminServlet extends HttpServlet {
    private final UserDao users = new UserDao();
    private final ActivityDao activity = new ActivityDao();

    @Override
    protected void service(HttpServletRequest request, HttpServletResponse response) throws IOException {
        JsonUtil.run(response, () -> route(request, response));
    }

    private void route(HttpServletRequest request, HttpServletResponse response) throws IOException, SQLException {
        User admin = Auth.requireUser(request);
        Auth.requireAdmin(admin);
        String[] parts = JsonUtil.segments(request, "/api/admin");
        String method = request.getMethod();
        if (parts.length == 1 && "users".equals(parts[0]) && "GET".equals(method)) {
            JsonUtil.write(response, HttpServletResponse.SC_OK, users.listAll());
            return;
        }
        if (parts.length == 3 && "users".equals(parts[0]) && "role".equals(parts[2]) && "PUT".equals(method)) {
            changeRole(request, response, admin, Ids.requireId(parts[1], "id"));
            return;
        }
        if (parts.length == 1 && "analytics".equals(parts[0]) && "GET".equals(method)) {
            JsonUtil.write(response, HttpServletResponse.SC_OK, activity.analytics());
            return;
        }
        if (parts.length == 1 && "settings".equals(parts[0]) && "GET".equals(method)) {
            JsonUtil.write(response, HttpServletResponse.SC_OK, SiteSettings.load());
            return;
        }
        if (parts.length == 1 && "settings".equals(parts[0]) && "PUT".equals(method)) {
            saveSettings(request, response);
            return;
        }
        JsonUtil.writeError(response, HttpServletResponse.SC_NOT_FOUND, "Not found");
    }

    private void changeRole(HttpServletRequest request, HttpServletResponse response, User admin, String userId)
            throws IOException, SQLException {
        if (admin.getId().equals(userId)) {
            throw new AuthException(HttpServletResponse.SC_FORBIDDEN, "You cannot change your own role.");
        }
        JsonObject body = JsonUtil.readObject(request);
        String role = JsonUtil.text(body, "role", 20, true);
        if (!Auth.ROLE_USER.equals(role) && !Auth.ROLE_LIBRARIAN.equals(role)) {
            throw new IllegalArgumentException("role must be user or librarian");
        }
        User existing = users.findById(userId);
        if (existing == null) {
            JsonUtil.writeError(response, HttpServletResponse.SC_NOT_FOUND, "User not found");
            return;
        }
        if (Auth.ROLE_ADMIN.equals(existing.getRole())) {
            throw new AuthException(HttpServletResponse.SC_FORBIDDEN, "Admin accounts cannot be reassigned here.");
        }
        if (!users.updateRole(userId, role)) {
            throw new AuthException(HttpServletResponse.SC_FORBIDDEN, "That role could not be changed.");
        }
        JsonUtil.write(response, HttpServletResponse.SC_OK, users.findById(userId));
    }

    private void saveSettings(HttpServletRequest request, HttpServletResponse response) throws IOException {
        JsonObject body = JsonUtil.readObject(request);
        String libraryName = JsonUtil.text(body, "libraryName", 100, true);
        if (!body.has("registrationOpen") || !body.get("registrationOpen").isJsonPrimitive()
                || !body.get("registrationOpen").getAsJsonPrimitive().isBoolean()) {
            throw new IllegalArgumentException("registrationOpen is required");
        }
        boolean registrationOpen = body.get("registrationOpen").getAsBoolean();
        JsonUtil.write(response, HttpServletResponse.SC_OK, SiteSettings.save(libraryName, registrationOpen));
    }
}
