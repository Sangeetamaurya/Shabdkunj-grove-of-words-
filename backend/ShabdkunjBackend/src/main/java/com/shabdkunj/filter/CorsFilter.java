package com.shabdkunj.filter;

import java.io.IOException;
import java.util.LinkedHashSet;
import java.util.Set;
import javax.servlet.Filter;
import javax.servlet.FilterChain;
import javax.servlet.FilterConfig;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

public class CorsFilter implements Filter {
    private Set<String> allowedOrigins = Set.of();

    @Override
    public void init(FilterConfig filterConfig) {
        String configured = System.getenv("SHABDKUNJ_CORS_ORIGINS");
        if (configured == null || configured.isBlank()) {
            allowedOrigins = Set.of("http://localhost:3000", "http://127.0.0.1:3000");
            return;
        }

        Set<String> origins = new LinkedHashSet<>();
        for (String part : configured.split(",")) {
            String origin = part.trim();
            if (origin.isEmpty() || "*".equals(origin)) {
                continue;
            }
            origins.add(origin);
        }
        allowedOrigins = Set.copyOf(origins);
    }

    @Override
    public void doFilter(javax.servlet.ServletRequest request, javax.servlet.ServletResponse response, FilterChain chain)
            throws IOException, ServletException {
        HttpServletRequest httpRequest = (HttpServletRequest) request;
        HttpServletResponse httpResponse = (HttpServletResponse) response;
        String origin = httpRequest.getHeader("Origin");

        if (origin != null && allowedOrigins.contains(origin)) {
            httpResponse.setHeader("Access-Control-Allow-Origin", origin);
            httpResponse.setHeader("Access-Control-Allow-Credentials", "true");
            httpResponse.setHeader("Vary", "Origin");
            httpResponse.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
            httpResponse.setHeader("Access-Control-Allow-Headers", "Content-Type, Accept");
            httpResponse.setHeader("Access-Control-Max-Age", "3600");
        }

        if ("OPTIONS".equalsIgnoreCase(httpRequest.getMethod())) {
            if (origin != null && allowedOrigins.contains(origin)) {
                httpResponse.setStatus(HttpServletResponse.SC_NO_CONTENT);
            } else {
                httpResponse.setStatus(HttpServletResponse.SC_FORBIDDEN);
            }
            return;
        }

        chain.doFilter(request, response);
    }

    @Override
    public void destroy() {
    }
}
