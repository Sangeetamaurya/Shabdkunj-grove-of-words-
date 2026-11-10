import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { ToastProvider } from "@/components/ui/Toast";
import { BookOverlay } from "@/components/books/BookOverlay";
import { ReadingModal } from "@/components/books/ReadingModal";

export const metadata: Metadata = {
  title: "Shabdkunj — Cozy Digital Library Platform",
  description:
    "Where every word finds a home. Discover remarkable books, collect the stories that move you, and join a community built around the joy of reading.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-[#FAF4E8] text-[#3B2A1E] font-sans antialiased min-h-screen flex flex-col selection:bg-[#B4532A]/20 selection:text-[#3B2A1E]">
        <ToastProvider>
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />

          {/* Global Interactive Overlays */}
          <BookOverlay />
          <ReadingModal />
        </ToastProvider>
      </body>
    </html>
  );
}
