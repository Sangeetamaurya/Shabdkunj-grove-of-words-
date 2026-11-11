package com.shabdkunj.controller;

import com.google.gson.JsonObject;
import com.shabdkunj.dao.ArticleDao;
import com.shabdkunj.dao.CommentDao;
import com.shabdkunj.dao.LikeDao;
import com.shabdkunj.model.Article;
import com.shabdkunj.model.Comment;
import com.shabdkunj.model.User;
import com.shabdkunj.util.Auth;
import com.shabdkunj.util.AuthException;
import com.shabdkunj.util.Ids;
import com.shabdkunj.util.JsonUtil;
import java.io.IOException;
import java.sql.SQLException;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

public class ArticleServlet extends HttpServlet {
    private static final Set<String> SORTS = Set.of("latest", "top", "trending");
    private static final Set<String> STATUSES = Set.of("draft", "published");
    private final ArticleDao articles = new ArticleDao();
    private final CommentDao comments = new CommentDao();
    private final LikeDao likes = new LikeDao();

    @Override
    protected void service(HttpServletRequest request, HttpServletResponse response) throws IOException {
        JsonUtil.run(response, () -> route(request, response));
    }

    private void route(HttpServletRequest request, HttpServletResponse response) throws IOException, SQLException {
        String[] parts = JsonUtil.segments(request, "/api/articles");
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
            one(request, response, Ids.requireId(parts[0], "id"));
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
        if (parts.length == 2 && "comments".equals(parts[1]) && "GET".equals(method)) {
            listComments(response, Ids.requireId(parts[0], "id"));
            return;
        }
        if (parts.length == 2 && "comments".equals(parts[1]) && "POST".equals(method)) {
            addComment(request, response, Ids.requireId(parts[0], "id"));
            return;
        }
        if (parts.length > 2 || (parts.length == 2 && !"like".equals(parts[1]) && !"comments".equals(parts[1]))) {
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
        String status = JsonUtil.query(request, "status");
        if (status != null && !STATUSES.contains(status)) {
            throw new IllegalArgumentException("status is invalid");
        }
        String authorId = JsonUtil.query(request, "authorId");
        if (authorId != null) {
            Ids.requireId(authorId, "authorId");
        }
        String search = JsonUtil.query(request, "search");
        if (search != null && search.length() > 200) {
            throw new IllegalArgumentException("search is too long");
        }
        String category = JsonUtil.query(request, "category");

        boolean includesDrafts = "draft".equals(status) || (status == null && authorId != null);
        if (includesDrafts) {
            User user = Auth.requireUser(request);
            if (!Auth.isStaff(user)) {
                if (authorId != null && !authorId.equals(user.getId())) {
                    throw new AuthException(HttpServletResponse.SC_FORBIDDEN, "Unauthorized");
                }
                authorId = user.getId();
            }
        } else if (status == null) {
            status = "published";
        }

        List<Article> result = articles.find(
                category,
                search,
                sort,
                status,
                authorId,
                JsonUtil.optionalQueryInt(request, "limit"));
        JsonUtil.write(response, HttpServletResponse.SC_OK, result);
    }

    private void one(HttpServletRequest request, HttpServletResponse response, String id)
            throws IOException, SQLException {
        Article article = articles.findById(id);
        if (article == null) {
            JsonUtil.writeError(response, HttpServletResponse.SC_NOT_FOUND, "Article not found");
            return;
        }
        if ("draft".equals(article.getStatus())) {
            User user = Auth.requireUser(request);
            if (!user.getId().equals(article.getAuthorId()) && !Auth.isStaff(user)) {
                throw new AuthException(HttpServletResponse.SC_FORBIDDEN, "Unauthorized");
            }
        }
        JsonUtil.write(response, HttpServletResponse.SC_OK, article);
    }

    private void create(HttpServletRequest request, HttpServletResponse response) throws IOException, SQLException {
        User user = Auth.requireUser(request);
        JsonObject body = JsonUtil.readObject(request);
        String status = JsonUtil.text(body, "status", 20, true);
        if (!STATUSES.contains(status)) {
            throw new IllegalArgumentException("status is invalid");
        }
        String content = JsonUtil.textAllowEmpty(body, "content", 500_000, "published".equals(status));
        if (content == null) {
            content = "";
        }
        Article article = articles.create(
                user.getId(),
                JsonUtil.text(body, "title", 255, true),
                JsonUtil.text(body, "subtitle", 500, false),
                JsonUtil.text(body, "image", 500, false),
                content,
                JsonUtil.text(body, "category", 100, true),
                status,
                Ids.readTime(content));
        JsonUtil.write(response, HttpServletResponse.SC_CREATED, article);
    }

    private void update(HttpServletRequest request, HttpServletResponse response, String id)
            throws IOException, SQLException {
        User user = Auth.requireUser(request);
        Article existing = articles.findById(id);
        if (existing == null) {
            JsonUtil.writeError(response, HttpServletResponse.SC_NOT_FOUND, "Article not found");
            return;
        }
        if (!user.getId().equals(existing.getAuthorId()) && !Auth.isStaff(user)) {
            throw new AuthException(HttpServletResponse.SC_FORBIDDEN, "Unauthorized to edit this article.");
        }
        JsonObject body = JsonUtil.readObject(request);
        Map<String, Object> changes = new LinkedHashMap<>();
        if (body.has("title")) {
            changes.put("title", JsonUtil.text(body, "title", 255, true));
        }
        if (body.has("subtitle")) {
            changes.put("subtitle", JsonUtil.text(body, "subtitle", 500, false));
        }
        if (body.has("image")) {
            changes.put("image", JsonUtil.text(body, "image", 500, false));
        }
        if (body.has("category")) {
            changes.put("category", JsonUtil.text(body, "category", 100, true));
        }
        if (body.has("status")) {
            String status = JsonUtil.text(body, "status", 20, true);
            if (!STATUSES.contains(status)) {
                throw new IllegalArgumentException("status is invalid");
            }
            changes.put("status", status);
        }
        String nextContent = existing.getContent();
        if (body.has("content")) {
            boolean publishing = "published".equals(changes.getOrDefault("status", existing.getStatus()));
            nextContent = JsonUtil.textAllowEmpty(body, "content", 500_000, publishing);
            if (nextContent == null) {
                nextContent = "";
            }
            changes.put("content", nextContent);
            changes.put("readTime", Ids.readTime(nextContent));
        }
        String nextStatus = (String) changes.getOrDefault("status", existing.getStatus());
        if ("published".equals(nextStatus) && (nextContent == null || nextContent.trim().isEmpty())) {
            throw new IllegalArgumentException("content is required");
        }
        Article article = articles.update(id, changes);
        JsonUtil.write(response, HttpServletResponse.SC_OK, article);
    }

    private void delete(HttpServletRequest request, HttpServletResponse response, String id)
            throws IOException, SQLException {
        User user = Auth.requireUser(request);
        Article existing = articles.findById(id);
        if (existing == null) {
            JsonUtil.writeError(response, HttpServletResponse.SC_NOT_FOUND, "Article not found");
            return;
        }
        if (!user.getId().equals(existing.getAuthorId()) && !Auth.isStaff(user)) {
            throw new AuthException(HttpServletResponse.SC_FORBIDDEN,
                    "Unauthorized: You do not have permission to delete this article.");
        }
        articles.delete(id);
        JsonUtil.write(response, HttpServletResponse.SC_OK, true);
    }

    private void likeStatus(HttpServletRequest request, HttpServletResponse response, String id)
            throws IOException, SQLException {
        Article article = articles.findById(id);
        if (article == null || ("draft".equals(article.getStatus()) && !canReadDraft(request, article))) {
            JsonUtil.writeError(response, HttpServletResponse.SC_NOT_FOUND, "Article not found");
            return;
        }
        User user = Auth.optionalUser(request);
        boolean liked = user != null && likes.articleLiked(user.getId(), id);
        JsonUtil.write(response, HttpServletResponse.SC_OK, liked);
    }

    private void toggleLike(HttpServletRequest request, HttpServletResponse response, String id)
            throws IOException, SQLException {
        User user = Auth.requireUser(request);
        Article article = articles.findById(id);
        if (article == null) {
            JsonUtil.writeError(response, HttpServletResponse.SC_NOT_FOUND, "Article not found");
            return;
        }
        if ("draft".equals(article.getStatus()) && !user.getId().equals(article.getAuthorId()) && !Auth.isStaff(user)) {
            throw new AuthException(HttpServletResponse.SC_FORBIDDEN, "Unauthorized");
        }
        Map<String, Object> result = likes.toggleArticle(user.getId(), id);
        if (result == null) {
            JsonUtil.writeError(response, HttpServletResponse.SC_NOT_FOUND, "Article not found");
            return;
        }
        JsonUtil.write(response, HttpServletResponse.SC_OK, result);
    }

    private void listComments(HttpServletResponse response, String articleId) throws IOException, SQLException {
        Article article = articles.findById(articleId);
        if (article == null || "draft".equals(article.getStatus())) {
            JsonUtil.writeError(response, HttpServletResponse.SC_NOT_FOUND, "Article not found");
            return;
        }
        JsonUtil.write(response, HttpServletResponse.SC_OK, comments.findByArticle(articleId));
    }

    private void addComment(HttpServletRequest request, HttpServletResponse response, String articleId)
            throws IOException, SQLException {
        User user = Auth.requireUser(request);
        Article article = articles.findById(articleId);
        if (article == null || "draft".equals(article.getStatus())) {
            JsonUtil.writeError(response, HttpServletResponse.SC_NOT_FOUND, "Article not found");
            return;
        }
        JsonObject body = JsonUtil.readObject(request);
        String text = JsonUtil.text(body, "text", 65535, true);
        Comment comment = comments.create(articleId, user.getId(), text);
        JsonUtil.write(response, HttpServletResponse.SC_CREATED, comment);
    }

    private boolean canReadDraft(HttpServletRequest request, Article article) throws SQLException {
        User user = Auth.optionalUser(request);
        return user != null && (user.getId().equals(article.getAuthorId()) || Auth.isStaff(user));
    }
}
