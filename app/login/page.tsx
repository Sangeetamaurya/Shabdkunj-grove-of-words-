"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import { useToast } from "@/components/ui/Toast";
import { BookOpen, UserCheck, ShieldCheck, LogIn, ArrowRight } from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams?.get("redirect") || "/";

  const { login, switchRole } = useAuthStore();
  const { success, error } = useToast();

  const [email, setEmail] = useState("amelia@shabdkunj.org");
  const [password, setPassword] = useState("password123");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const ok = await login(email, password);
    setIsSubmitting(false);

    if (ok) {
      success("Welcome back to Shabdkunj");
      router.push(redirect);
    } else {
      error("Invalid credentials. Try one of our demo accounts below.");
    }
  };

  const handleQuickLogin = (role: "user" | "librarian" | "admin") => {
    switchRole(role);
    success(`Signed in as ${role}`);
    router.push(redirect);
  };

  return (
    <div className="min-h-screen bg-[#FAF4E8] flex items-center justify-center py-16 px-4 sm:px-6">
      <div className="max-w-md w-full bg-[#FFFDF7] rounded-2xl border border-[#E6D9C3] p-8 shadow-warm-lg">
        {/* Logo and Welcome */}
        <div className="text-center mb-8">
          <div className="w-10 h-10 rounded-xl bg-[#182631] text-white mx-auto flex items-center justify-center font-serif text-xl font-bold shadow-sm mb-3">
            श
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-medium text-[#3B2A1E]">
            Welcome back
          </h1>
          <p className="text-xs text-[#7A6552] mt-1">
            Enter your sanctuary of words and reflections
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#7A6552] uppercase tracking-wider mb-1">
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@shabdkunj.org"
              className="w-full px-3.5 py-2.5 bg-[#FAF4E8] border border-[#E6D9C3] rounded-lg text-sm text-[#3B2A1E] focus:outline-none focus:border-[#8B5E3C]"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-[#7A6552] uppercase tracking-wider">
                Password
              </label>
            </div>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3.5 py-2.5 bg-[#FAF4E8] border border-[#E6D9C3] rounded-lg text-sm text-[#3B2A1E] focus:outline-none focus:border-[#8B5E3C]"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full mt-2 py-3 rounded-full bg-[#182631] hover:bg-[#2A4154] text-white text-xs font-semibold uppercase tracking-wider transition-colors shadow-sm flex items-center justify-center gap-2"
          >
            <LogIn className="w-4 h-4" />
            <span>{isSubmitting ? "Signing in..." : "Enter Library"}</span>
          </button>
        </form>

        {/* Quick Demo Logins */}
        <div className="mt-8 pt-6 border-t border-[#E6D9C3]/70">
          <div className="text-[11px] font-bold uppercase tracking-wider text-[#7A6552] text-center mb-3">
            Quick Demo Persona Sign-In:
          </div>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleQuickLogin("user")}
              className="p-2 rounded-lg bg-[#FAF4E8] border border-[#E6D9C3] hover:border-[#8B5E3C] text-center transition-all group"
            >
              <UserCheck className="w-4 h-4 text-emerald-600 mx-auto mb-1" />
              <div className="text-[11px] font-semibold text-[#3B2A1E]">Reader</div>
              <div className="text-[9px] text-[#7A6552]">Amelia</div>
            </button>

            <button
              type="button"
              onClick={() => handleQuickLogin("librarian")}
              className="p-2 rounded-lg bg-[#FAF4E8] border border-[#E6D9C3] hover:border-[#8B5E3C] text-center transition-all group"
            >
              <BookOpen className="w-4 h-4 text-amber-600 mx-auto mb-1" />
              <div className="text-[11px] font-semibold text-[#3B2A1E]">Librarian</div>
              <div className="text-[9px] text-[#7A6552]">Elena</div>
            </button>

            <button
              type="button"
              onClick={() => handleQuickLogin("admin")}
              className="p-2 rounded-lg bg-[#FAF4E8] border border-[#E6D9C3] hover:border-[#8B5E3C] text-center transition-all group"
            >
              <ShieldCheck className="w-4 h-4 text-[#B4532A] mx-auto mb-1" />
              <div className="text-[11px] font-semibold text-[#3B2A1E]">Admin</div>
              <div className="text-[9px] text-[#7A6552]">Vikram</div>
            </button>
          </div>
        </div>

        {/* Signup Link */}
        <div className="mt-6 text-center text-xs text-[#7A6552]">
          <span>Don&apos;t have an account? </span>
          <Link
            href={`/signup?redirect=${encodeURIComponent(redirect)}`}
            className="text-[#B4532A] font-semibold hover:underline"
          >
            Join Shabdkunj
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#FAF4E8] flex items-center justify-center">Loading...</div>}>
      <LoginForm />
    </Suspense>
  );
}
