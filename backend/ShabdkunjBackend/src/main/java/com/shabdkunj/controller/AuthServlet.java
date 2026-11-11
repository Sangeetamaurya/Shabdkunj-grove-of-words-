package com.shabdkunj.controller;

import com.google.gson.JsonObject;
import com.shabdkunj.config.SiteSettings;
import com.shabdkunj.dao.UserDao;
import com.shabdkunj.model.User;
import com.shabdkunj.util.Auth;
import com.shabdkunj.util.AuthException;
import com.shabdkunj.util.JsonUtil;
import com.shabdkunj.util.PasswordUtil;
import java.io.IOException;
import java.sql.SQLException;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.HttpSession;

public class AuthServlet extends HttpServlet {
    private final UserDao users = new UserDao();

    @Override
    protected void service(HttpServletRequest request, HttpServletResponse response) throws IOException {
        JsonUtil.run(response, () -> route(request, response));
    }

    private void route(HttpServletRequest request, HttpServletResponse response) throws IOException, SQLException {
        String[] parts = JsonUtil.segments(request, "/api/auth");
        if (parts.length != 1) {
            JsonUtil.writeError(response, HttpServletResponse.SC_NOT_FOUND, "Not found");
            return;
        }
        switch (parts[0]) {
            case "signup" -> signup(request, response);
            case "login" -> login(request, response);
            case "demo" -> demoLogin(request, response);
            case "logout" -> logout(request, response);
            case "me" -> me(request, response);
            default -> JsonUtil.writeError(response, HttpServletResponse.SC_NOT_FOUND, "Not found");
        }
    }

    private void signup(HttpServletRequest request, HttpServletResponse response) throws IOException, SQLException {
        if (!"POST".equals(request.getMethod())) {
            JsonUtil.writeError(response, HttpServletResponse.SC_METHOD_NOT_ALLOWED, "Method not allowed");
            return;
        }
        if (!SiteSettings.isRegistrationOpen()) {
            throw new AuthException(HttpServletResponse.SC_FORBIDDEN, "Registration is closed.");
        }
        JsonObject body = JsonUtil.readObject(request);
        String name = JsonUtil.text(body, "name", 100, true);
        String email = JsonUtil.text(body, "email", 150, true);
        String password = password(body);
        if (!email.contains("@") || email.startsWith("@") || email.endsWith("@")) {
            throw new IllegalArgumentException("email is invalid");
        }
        if (users.findByEmail(email) != null) {
            throw new AuthException(HttpServletResponse.SC_CONFLICT, "An account with this email already exists.");
        }
        User user;
        try {
            user = users.create(name, email, password);
        } catch (SQLException exception) {
            if (JsonUtil.isDuplicate(exception)) {
                throw new AuthException(HttpServletResponse.SC_CONFLICT, "An account with this email already exists.");
            }
            throw exception;
        }
        Auth.startSession(request, user);
        JsonUtil.write(response, HttpServletResponse.SC_CREATED, user);
    }

    private void login(HttpServletRequest request, HttpServletResponse response) throws IOException, SQLException {
        if (!"POST".equals(request.getMethod())) {
            JsonUtil.writeError(response, HttpServletResponse.SC_METHOD_NOT_ALLOWED, "Method not allowed");
            return;
        }
        JsonObject body = JsonUtil.readObject(request);
        String email = JsonUtil.text(body, "email", 150, true);
        String password = JsonUtil.text(body, "password", 200, true);
        User user = users.findByEmail(email);
        if (user == null || !PasswordUtil.verify(password, user.getPasswordHash()) || !Auth.isKnownRole(user.getRole())) {
            throw new AuthException(HttpServletResponse.SC_UNAUTHORIZED, "Invalid email or password");
        }
        Auth.startSession(request, user);
        JsonUtil.write(response, HttpServletResponse.SC_OK, user);
    }

    private void demoLogin(HttpServletRequest request, HttpServletResponse response) throws IOException, SQLException {
        if (!"POST".equals(request.getMethod())) {
            JsonUtil.writeError(response, HttpServletResponse.SC_METHOD_NOT_ALLOWED, "Method not allowed");
            return;
        }
        if (!demoLoginAllowed(request)) {
            throw new AuthException(HttpServletResponse.SC_FORBIDDEN, "Demo sign-in is only available on this local server.");
        }
        JsonObject body = JsonUtil.readObject(request);
        String role = JsonUtil.text(body, "role", 20, true);
        String email = switch (role) {
            case Auth.ROLE_USER -> "amelia@shabdkunj.org";
            case Auth.ROLE_LIBRARIAN -> "elena@shabdkunj.org";
            case Auth.ROLE_ADMIN -> "vikram@shabdkunj.org";
            default -> throw new IllegalArgumentException("role is invalid");
        };
        User user = users.findByEmail(email);
        if (user == null || !role.equals(user.getRole()) || !Auth.isKnownRole(user.getRole())) {
            throw new AuthException(HttpServletResponse.SC_UNAUTHORIZED, "That demo account is not available.");
        }
        Auth.startSession(request, user);
        JsonUtil.write(response, HttpServletResponse.SC_OK, user);
    }

    private boolean demoLoginAllowed(HttpServletRequest request) {
        if ("false".equalsIgnoreCase(System.getenv("SHABDKUNJ_DEMO_LOGIN"))) {
            return false;
        }
        String remote = request.getRemoteAddr();
        return "127.0.0.1".equals(remote) || "::1".equals(remote) || "0:0:0:0:0:0:0:1".equals(remote);
    }

    private void logout(HttpServletRequest request, HttpServletResponse response) throws IOException {
        if (!"POST".equals(request.getMethod())) {
            JsonUtil.writeError(response, HttpServletResponse.SC_METHOD_NOT_ALLOWED, "Method not allowed");
            return;
        }
        HttpSession session = request.getSession(false);
        if (session != null) {
            session.invalidate();
        }
        response.setStatus(HttpServletResponse.SC_NO_CONTENT);
    }

    private void me(HttpServletRequest request, HttpServletResponse response) throws IOException, SQLException {
        if (!"GET".equals(request.getMethod())) {
            JsonUtil.writeError(response, HttpServletResponse.SC_METHOD_NOT_ALLOWED, "Method not allowed");
            return;
        }
        JsonUtil.write(response, HttpServletResponse.SC_OK, Auth.requireUser(request));
    }

    private String password(JsonObject body) {
        String password = JsonUtil.text(body, "password", 200, true);
        if (password.length() < 8) {
            throw new IllegalArgumentException("password must be at least 8 characters");
        }
        return password;
    }
}
