import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Curated spine colors for vintage library books
export const SPINE_COLORS = [
  { bg: "#6E2B27", text: "#F3E5D8", gold: "#D4AF37", name: "Deep Crimson" },
  { bg: "#234133", text: "#E5EFEA", gold: "#E2C37E", name: "Forest Green" },
  { bg: "#1D3147", text: "#E3ECF5", gold: "#CFB57A", name: "Midnight Navy" },
  { bg: "#8A5A1A", text: "#FAF0DC", gold: "#F5D48B", name: "Amber Ochre" },
  { bg: "#4B2844", text: "#F3E4F0", gold: "#DEBA85", name: "Royal Plum" },
  { bg: "#204F53", text: "#E4F3F4", gold: "#D9BE84", name: "Antique Teal" },
  { bg: "#873E23", text: "#FCECE6", gold: "#E5BF80", name: "Terracotta" },
  { bg: "#363636", text: "#F5F5F5", gold: "#CBB379", name: "Charcoal Leather" },
  { bg: "#4A3B32", text: "#F0EAE1", gold: "#DFBE7B", name: "Walnut Brown" },
];

// Hash function to consistently get spine properties from book id
export function getSpineProperties(bookId: string | number) {
  const str = String(bookId);
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  const positiveHash = Math.abs(hash);

  // Deterministic spine width: 38px to 54px
  const width = 38 + (positiveHash % 17);
  // Deterministic spine height: 200px to 240px
  const height = 200 + ((positiveHash >> 2) % 41);
  // Deterministic color palette
  const colorIndex = positiveHash % SPINE_COLORS.length;
  const color = SPINE_COLORS[colorIndex];

  return {
    width,
    height,
    color,
  };
}

export function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(date);
  } catch {
    return dateString;
  }
}

export function debounce<T extends (...args: any[]) => void>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}
