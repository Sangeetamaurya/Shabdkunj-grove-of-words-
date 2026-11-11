package com.shabdkunj.util;

import com.shabdkunj.dao.UserDao;
import com.shabdkunj.model.User;
import java.sql.SQLException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpSession;

public final class Auth {
    public static final String ROLE_USER = "user";
    public static final String ROLE_LIBRARIAN = "librarian";
    public static final String ROLE_ADMIN = "admin";
    public static final String USER_ID = "userId";

    private static final UserDao USERS = new UserDao();

    private Auth() {
    }

    public static User requireUser(HttpServletRequest request) throws SQLException {
        User user = optionalUser(request);
        if (user == null) {
            throw new AuthException(401, "Authentication required");
        }
        if (!isKnownRole(user.getRole())) {
            throw new AuthException(403, "Unauthorized");
        }
        return user;
    }

    public static User optionalUser(HttpServletRequest request) throws SQLException {
        HttpSession session = request.getSession(false);
        if (session == null) {
            return null;
        }
        Object value = session.getAttribute(USER_ID);
        if (!(value instanceof String userId) || userId.isBlank()) {
            return null;
        }
        return USERS.findById(userId);
    }

    public static void requireStaff(User user) {
        if (!isStaff(user)) {
            throw new AuthException(403, "Unauthorized: Only Admins or Librarians can manage books.");
        }
    }

    public static void requireAdmin(User user) {
        if (user == null || !ROLE_ADMIN.equals(user.getRole())) {
            throw new AuthException(403, "Unauthorized: Only an Admin can do that.");
        }
    }

    public static boolean isStaff(User user) {
        return user != null && (ROLE_LIBRARIAN.equals(user.getRole()) || ROLE_ADMIN.equals(user.getRole()));
    }

    public static boolean isKnownRole(String role) {
        return ROLE_USER.equals(role) || ROLE_LIBRARIAN.equals(role) || ROLE_ADMIN.equals(role);
    }

    public static void startSession(HttpServletRequest request, User user) {
        HttpSession session = request.getSession(true);
        if (request.isRequestedSessionIdValid()) {
            request.changeSessionId();
        }
        session.setAttribute(USER_ID, user.getId());
    }
}
