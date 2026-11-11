package com.shabdkunj.util;

import java.util.UUID;

public final class Ids {
    private Ids() {
    }

    public static String next(String prefix) {
        String id = prefix + UUID.randomUUID().toString().replace("-", "");
        return id.length() <= 50 ? id : id.substring(0, 50);
    }

    public static String requireId(String id, String name) {
        if (id == null || id.isBlank() || id.length() > 50) {
            throw new IllegalArgumentException(name + " is invalid");
        }
        return id;
    }

    public static String readTime(String content) {
        String text = content == null ? "" : content.trim();
        int words = text.isEmpty() ? 0 : text.split("\\s+").length;
        int minutes = Math.max(1, (int) Math.ceil(words / 200.0));
        return minutes + " min read";
    }

    public static String likePattern(String raw) {
        StringBuilder pattern = new StringBuilder("%");
        for (int i = 0; i < raw.length(); i++) {
            char character = raw.charAt(i);
            if (character == '\\' || character == '%' || character == '_') {
                pattern.append('\\');
            }
            pattern.append(Character.toLowerCase(character));
        }
        pattern.append('%');
        return pattern.toString();
    }
}
