"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import * as api from "@/lib/api";
import {
  Search,
  PenSquare,
  LogOut,
  UserCircle,
  PlusCircle,
  Menu,
  X,
  LogIn,
  UserPlus,
} from "lucide-react";

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [isScrolled, setIsScrolled] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 15);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    let active = true;
    api.getCurrentUser()
      .then((current) => {
        if (active) useAuthStore.setState({ user: current });
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/books?search=${encodeURIComponent(searchQuery.trim())}`);
      setMobileMenuOpen(false);
    }
  };

  // Keyboard shortcut ⌘K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        const searchInput = document.getElementById("global-search-input");
        searchInput?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const isAdminOrLibrarian = user?.role === "admin" || user?.role === "librarian";

  return (
    <header
      className={`sticky top-0 z-40 transition-all duration-200 ${
        isScrolled
          ? "bg-[#FAF4E8]/95 backdrop-blur-md border-b border-[#E6D9C3] shadow-sm py-3"
          : "bg-[#FAF4E8] border-b border-[#E6D9C3]/70 py-4"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-3">
        {/* Left: Logo & Nav Links */}
        <div className="flex items-center gap-6 sm:gap-8">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-[#182631] text-[#FAF4E8] flex items-center justify-center font-serif font-bold text-lg shadow-sm group-hover:scale-105 transition-transform">
              श
            </div>
            <span className="font-serif font-bold text-xl tracking-tight text-[#3B2A1E]">
              Shabdkunj
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
            <Link
              href="/books"
              className={`transition-colors relative py-1 ${
                pathname.startsWith("/books")
                  ? "text-[#3B2A1E] font-semibold"
                  : "text-[#7A6552] hover:text-[#3B2A1E]"
              }`}
            >
              Books
              {pathname.startsWith("/books") && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#B4532A] rounded-full" />
              )}
            </Link>
            <Link
              href="/articles"
              className={`transition-colors relative py-1 ${
                pathname.startsWith("/articles")
                  ? "text-[#3B2A1E] font-semibold"
                  : "text-[#7A6552] hover:text-[#3B2A1E]"
              }`}
            >
              Articles
              {pathname.startsWith("/articles") && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#B4532A] rounded-full" />
              )}
            </Link>
          </nav>
        </div>

        {/* Center: Search Box */}
        <div className="flex-1 max-w-md mx-2 hidden sm:block">
          <form onSubmit={handleSearchSubmit} className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7A6552]" />
            <input
              id="global-search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search books or articles..."
              className="w-full pl-9 pr-12 py-1.5 bg-[#FFFDF7] border border-[#E6D9C3] rounded-full text-xs sm:text-sm text-[#3B2A1E] placeholder:text-[#A48F7B] focus:outline-none focus:border-[#8B5E3C] focus:ring-1 focus:ring-[#8B5E3C] shadow-inner transition-colors"
            />
            <kbd className="absolute right-3 top-1/2 -translate-y-1/2 px-1.5 py-0.5 text-[10px] font-mono text-[#7A6552] bg-[#FAF4E8] border border-[#E6D9C3] rounded shadow-xs">
              ⌘K
            </kbd>
          </form>
        </div>

        {/* Right: Actions, Login, Signup & User Profile */}
        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            href="/write"
            className="flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-1.5 rounded-full bg-[#182631] text-[#FAF4E8] hover:bg-[#2A4154] text-xs sm:text-sm font-medium transition-all shadow-sm"
          >
            <PenSquare className="w-3.5 h-3.5" />
            <span className="hidden xs:inline">Write</span>
          </Link>

          {user ? (
            <div className="relative">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#B4532A] text-[#FAF4E8] font-serif font-semibold text-xs sm:text-sm flex items-center justify-center border-2 border-[#FFFDF7] shadow-sm hover:ring-2 hover:ring-[#8B5E3C] transition-all"
                title={`${user.name} (${user.role})`}
              >
                {user.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase()}
              </button>

              {dropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setDropdownOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-60 bg-[#FFFDF7] rounded-xl border border-[#E6D9C3] shadow-warm-lg py-1.5 z-50 text-sm text-[#3B2A1E]">
                    <div className="px-4 py-2 border-b border-[#E6D9C3]/70">
                      <div className="font-semibold text-sm truncate">{user.name}</div>
                      <div className="text-xs text-[#7A6552] truncate">{user.email}</div>
                      <div className="mt-1 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#FAF4E8] text-[#B4532A] border border-[#E6D9C3]">
                        {user.role}
                      </div>
                    </div>

                    <Link
                      href="/profile"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2 hover:bg-[#FAF4E8] transition-colors"
                    >
                      <UserCircle className="w-4 h-4 text-[#7A6552]" />
                      <span>Reading Board & Profile</span>
                    </Link>

                    {isAdminOrLibrarian && (
                      <Link
                        href="/admin/books/new"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 hover:bg-[#FAF4E8] text-[#B4532A] font-medium transition-colors"
                      >
                        <PlusCircle className="w-4 h-4" />
                        <span>Add New Book</span>
                      </Link>
                    )}
                    {isAdminOrLibrarian && (
                      <Link
                        href="/admin/activity"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 hover:bg-[#FAF4E8] transition-colors"
                      >
                        <span>Library activity</span>
                      </Link>
                    )}
                    {user.role === "admin" && (
                      <>
                        <Link
                          href="/admin/users"
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2 hover:bg-[#FAF4E8] transition-colors"
                        >
                          <span>Readers & librarians</span>
                        </Link>
                        <Link
                          href="/admin/analytics"
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2 hover:bg-[#FAF4E8] transition-colors"
                        >
                          <span>Website analytics</span>
                        </Link>
                        <Link
                          href="/admin/settings"
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2 hover:bg-[#FAF4E8] transition-colors"
                        >
                          <span>Website settings</span>
                        </Link>
                      </>
                    )}

                    <Link
                      href="/login"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2 hover:bg-[#FAF4E8] text-[#7A6552] transition-colors"
                    >
                      <LogIn className="w-4 h-4" />
                      <span>Switch Account / Persona</span>
                    </Link>

                    <div className="border-t border-[#E6D9C3]/70 my-1" />

                    <button
                      onClick={() => {
                        logout();
                        setDropdownOpen(false);
                      }}
                      className="w-full flex items-center gap-2.5 px-4 py-2 text-stone-600 hover:bg-[#FAF4E8] hover:text-red-700 transition-colors text-left"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="px-3 py-1.5 text-xs sm:text-sm font-semibold text-[#3B2A1E] hover:text-[#B4532A] transition-colors"
              >
                Log In
              </Link>
              <Link
                href="/signup"
                className="px-3.5 py-1.5 text-xs sm:text-sm font-semibold rounded-full bg-[#B4532A] text-[#FAF4E8] hover:bg-[#8F3F1C] transition-colors shadow-sm"
              >
                Sign Up
              </Link>
            </div>
          )}

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-1.5 rounded-lg text-[#3B2A1E] hover:bg-[#FFFDF7] border border-transparent hover:border-[#E6D9C3]"
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-[#E6D9C3] bg-[#FFFDF7] px-4 py-4 mt-3 shadow-md flex flex-col gap-3">
          <form onSubmit={handleSearchSubmit} className="relative mb-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7A6552]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search books or articles..."
              className="w-full pl-9 pr-4 py-2 bg-[#FAF4E8] border border-[#E6D9C3] rounded-full text-xs text-[#3B2A1E]"
            />
          </form>

          <Link
            href="/books"
            onClick={() => setMobileMenuOpen(false)}
            className="px-3 py-2 rounded-lg text-sm font-medium hover:bg-[#FAF4E8] text-[#3B2A1E]"
          >
            Books & Shelves
          </Link>
          <Link
            href="/articles"
            onClick={() => setMobileMenuOpen(false)}
            className="px-3 py-2 rounded-lg text-sm font-medium hover:bg-[#FAF4E8] text-[#3B2A1E]"
          >
            Articles & Journal
          </Link>
          <Link
            href="/write"
            onClick={() => setMobileMenuOpen(false)}
            className="px-3 py-2 rounded-lg text-sm font-medium hover:bg-[#FAF4E8] text-[#B4532A]"
          >
            + Write a story
          </Link>

          {!user && (
            <div className="pt-2 border-t border-[#E6D9C3] flex items-center gap-3">
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="flex-1 py-2 text-center rounded-lg border border-[#E6D9C3] text-xs font-semibold"
              >
                Log In
              </Link>
              <Link
                href="/signup"
                onClick={() => setMobileMenuOpen(false)}
                className="flex-1 py-2 text-center rounded-lg bg-[#B4532A] text-white text-xs font-semibold"
              >
                Sign Up
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
