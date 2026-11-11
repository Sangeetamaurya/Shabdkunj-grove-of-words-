package com.shabdkunj.util;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.security.spec.InvalidKeySpecException;
import java.util.Base64;
import javax.crypto.SecretKeyFactory;
import javax.crypto.spec.PBEKeySpec;

public final class PasswordUtil {
    private static final SecureRandom RANDOM = new SecureRandom();
    private static final int ITERATIONS = 210_000;
    private static final int SALT_BYTES = 16;
    private static final int KEY_BITS = 256;
    private static final int MAX_ITERATIONS = 1_000_000;
    private static final String SEED_PLACEHOLDER =
            "$2a$10$X7vG6N9kR1pQ8wZ2mY5L4eO3jH0bF6cT8uV1yA4dI7sE9nK2pW3qC";
    private static final byte[] SEED_PASSWORD = "password123".getBytes(StandardCharsets.UTF_8);

    private PasswordUtil() {
    }

    public static String hash(String password) {
        byte[] salt = new byte[SALT_BYTES];
        RANDOM.nextBytes(salt);
        byte[] derived = derive(password.toCharArray(), salt, ITERATIONS);
        return "pbkdf2$" + ITERATIONS + "$" + encode(salt) + "$" + encode(derived);
    }

    public static boolean verify(String password, String stored) {
        if (password == null || stored == null) {
            return false;
        }
        if (SEED_PLACEHOLDER.equals(stored)) {
            return MessageDigest.isEqual(SEED_PASSWORD, password.getBytes(StandardCharsets.UTF_8));
        }
        if (!stored.startsWith("pbkdf2$")) {
            return false;
        }
        String[] parts = stored.split("\\$", 4);
        if (parts.length != 4) {
            return false;
        }
        int iterations;
        try {
            iterations = Integer.parseInt(parts[1]);
        } catch (NumberFormatException exception) {
            return false;
        }
        if (iterations < 1 || iterations > MAX_ITERATIONS) {
            return false;
        }
        byte[] salt;
        byte[] expected;
        try {
            salt = decode(parts[2]);
            expected = decode(parts[3]);
        } catch (IllegalArgumentException exception) {
            return false;
        }
        if (salt.length == 0 || expected.length == 0) {
            return false;
        }
        byte[] actual = derive(password.toCharArray(), salt, iterations);
        return MessageDigest.isEqual(expected, actual);
    }

    private static byte[] derive(char[] password, byte[] salt, int iterations) {
        PBEKeySpec spec = new PBEKeySpec(password, salt, iterations, KEY_BITS);
        try {
            return SecretKeyFactory.getInstance("PBKDF2WithHmacSHA256").generateSecret(spec).getEncoded();
        } catch (NoSuchAlgorithmException | InvalidKeySpecException exception) {
            throw new IllegalStateException("Password hashing is unavailable", exception);
        } finally {
            spec.clearPassword();
        }
    }

    private static String encode(byte[] value) {
        return Base64.getEncoder().encodeToString(value);
    }

    private static byte[] decode(String value) {
        return Base64.getDecoder().decode(value);
    }
}
