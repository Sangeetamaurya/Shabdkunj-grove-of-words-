# 🗄️ Shabdkunj (Grove of Words) — Database Architecture

This folder contains the complete **MySQL / MariaDB** database implementation for the **Shabdkunj Library Platform**, 100% aligned with the Feature Specification Document and the Next.js Frontend (`types/index.ts`, `lib/api.ts`, and `lib/mock-data.ts`).

---

## 📂 Files Included

| File | Description |
| :--- | :--- |
| **`schema.sql`** | Creates the `shabdkunj_db` database, all **6 core tables**, **3 SQL Views** (for camelCase frontend JSON mapping), and **4 Automatic Triggers** (for comment/like sync & cleanup). |
| **`seed.sql`** | Seeds the database with the **Admin, Librarian, System, and User accounts**, all **54 curated books** (across 15 genres with Gutenberg PDF & Internet Archive IDs), **6 articles**, comments, likes, and reading board items. |
| **`queries.sql`** | Ready-to-use SQL queries for all Backend API endpoints (`Top 15`, `Trending in last 7 days`, `Search`, `Drag-and-Drop Reading Board Upsert`, etc.). |

---

## 🔗 Entity-Relationship (ER) Diagram

```mermaid
erDiagram
    USERS ||--o{ BOOKS : "adds (added_by)"
    USERS ||--o{ ARTICLES : "writes (author_id)"
    USERS ||--o{ COMMENTS : "posts (user_id)"
    USERS ||--o{ LIKES : "gives (user_id)"
    USERS ||--o{ READING_LIST : "tracks (user_id)"
    BOOKS ||--o{ READING_LIST : "placed_on (book_id)"
    ARTICLES ||--o{ COMMENTS : "has (article_id)"

    USERS {
        varchar(50) id PK
        varchar(100) name
        varchar(150) email UK
        varchar(255) password_hash
        enum role "user | librarian | admin"
        varchar(500) avatar
        datetime created_at
    }

    BOOKS {
        varchar(50) id PK
        varchar(255) name
        varchar(150) author
        text description
        varchar(500) cover_image
        varchar(100) genre
        int likes_count
        datetime created_at
        varchar(50) added_by FK
        varchar(500) pdf_url
        int pages
        int publish_year
        varchar(100) open_library_key
        varchar(100) ia_id
    }

    ARTICLES {
        varchar(50) id PK
        varchar(50) author_id FK
        varchar(255) title
        varchar(500) subtitle
        varchar(500) image
        longtext content
        varchar(100) category
        enum status "draft | published"
        int likes_count
        int comments_count
        datetime created_at
        varchar(50) read_time
    }

    COMMENTS {
        varchar(50) id PK
        varchar(50) article_id FK
        varchar(50) user_id FK
        text text
        datetime created_at
    }

    LIKES {
        varchar(50) id PK
        varchar(50) user_id FK
        enum target_type "book | article"
        varchar(50) target_id
        datetime created_at
    }

    READING_LIST {
        varchar(50) id PK
        varchar(50) user_id FK
        varchar(50) book_id FK
        enum status "wishlist | reading | pending | done"
        datetime updated_at
    }
```

---

## 🚀 How to Run the Database Locally

```bash
# 1. Create the database, tables, views, and triggers
mysql -u root -p < database/schema.sql

# 2. Load the 54 books, users, articles, comments, and reading board data
mysql -u root -p < database/seed.sql
```