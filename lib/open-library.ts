import { Book } from "@/types";

// Mapping of our genres to Open Library subject keywords
export const GENRE_SUBJECT_MAP: Record<string, string> = {
  Fiction: "fiction",
  Science: "science",
  Physics: "physics",
  "Love & Romance": "romance",
  Knowledge: "history",
  "About Life": "self-help",
  Philosophy: "philosophy",
  History: "ancient_history",
  "Mystery & Thriller": "mystery_and_detective_stories",
  Poetry: "poetry",
  "Art & Design": "art",
  Technology: "computer_science",
  Psychology: "psychology",
  "Biography & Memoir": "biography",
  Classics: "classic_literature",
};

interface OpenLibraryWork {
  key: string;
  title: string;
  cover_id?: number;
  authors?: Array<{ name: string; key: string }>;
  first_publish_year?: number;
  subject?: string[];
  description?: string | { value: string };
  ia?: string[];
}

export async function fetchBooksFromOpenLibrary(
  genre: string,
  limit: number = 15
): Promise<Book[]> {
  try {
    const subject = GENRE_SUBJECT_MAP[genre] || genre.toLowerCase().replace(/[^a-z0-9]/g, "_");
    const url = `https://openlibrary.org/subjects/${encodeURIComponent(subject)}.json?limit=${limit}`;

    const res = await fetch(url, {
      next: { revalidate: 3600 }, // 1 hour cache
    });

    if (!res.ok) {
      return [];
    }

    const data = await res.json();
    const works: OpenLibraryWork[] = data.works || [];

    return works.map((work, index) => {
      const coverUrl = work.cover_id
        ? `https://covers.openlibrary.org/b/id/${work.cover_id}-L.jpg`
        : `https://picsum.photos/seed/${encodeURIComponent(work.title)}/600/900`;

      // Deterministic like count
      const pseudoLikes = 100 + ((work.title.length * 37 + index * 19) % 350);

      return {
        id: `ol_${work.key.replace("/works/", "")}`,
        name: work.title,
        author: work.authors?.[0]?.name || "Classic Author",
        description:
          typeof work.description === "string"
            ? work.description
            : work.description?.value ||
              `A celebrated work in ${genre} from the Open Library catalog, offering profound perspectives and enduring literary value.`,
        coverImage: coverUrl,
        genre: genre,
        likesCount: pseudoLikes,
        createdAt: new Date(Date.now() - index * 86400000 * 3).toISOString(),
        addedBy: "system",
        publishYear: work.first_publish_year || 1990,
        openLibraryKey: work.key,
        iaId: work.ia?.[0],
        pages: 200 + ((work.title.length * 13) % 400),
      };
    });
  } catch (error) {
    console.warn(`[Open Library] Could not fetch genre ${genre}:`, error);
    return [];
  }
}
