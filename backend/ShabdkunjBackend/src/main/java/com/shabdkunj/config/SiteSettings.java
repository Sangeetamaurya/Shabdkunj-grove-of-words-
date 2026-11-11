package com.shabdkunj.config;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import java.io.IOException;
import java.io.Reader;
import java.io.Writer;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;

public final class SiteSettings {
    private static final Gson GSON = new GsonBuilder().create();
    private static final Object LOCK = new Object();

    private String libraryName = "Shabdkunj";
    private boolean registrationOpen = true;

    public SiteSettings() {
    }

    public static SiteSettings load() {
        synchronized (LOCK) {
            Path path = file();
            if (!Files.exists(path)) {
                return new SiteSettings();
            }
            try (Reader reader = Files.newBufferedReader(path, StandardCharsets.UTF_8)) {
                SiteSettings settings = GSON.fromJson(reader, SiteSettings.class);
                return settings == null ? new SiteSettings() : settings;
            } catch (IOException exception) {
                throw new IllegalStateException("Could not read website settings", exception);
            }
        }
    }

    public static SiteSettings save(String libraryName, boolean registrationOpen) {
        synchronized (LOCK) {
            SiteSettings settings = new SiteSettings();
            settings.libraryName = libraryName;
            settings.registrationOpen = registrationOpen;
            Path path = file();
            try {
                Files.createDirectories(path.getParent());
                try (Writer writer = Files.newBufferedWriter(path, StandardCharsets.UTF_8)) {
                    GSON.toJson(settings, writer);
                }
            } catch (IOException exception) {
                throw new IllegalStateException("Could not save website settings", exception);
            }
            return settings;
        }
    }

    public static boolean isRegistrationOpen() {
        return load().registrationOpen;
    }

    public String getLibraryName() {
        return libraryName;
    }

    public boolean isRegistrationOpenValue() {
        return registrationOpen;
    }

    private static Path file() {
        String configured = System.getenv("SHABDKUNJ_SETTINGS_FILE");
        if (configured != null && !configured.isBlank()) {
            return Path.of(configured);
        }
        String base = System.getProperty("catalina.base", System.getProperty("java.io.tmpdir"));
        return Path.of(base, "conf", "shabdkunj-settings.json");
    }
}
