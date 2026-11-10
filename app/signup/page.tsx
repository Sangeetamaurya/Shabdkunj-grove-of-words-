"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import { useToast } from "@/components/ui/Toast";
import { UserPlus, ArrowRight } from "lucide-react";

function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams?.get("redirect") || "/";

  const { signup } = useAuthStore();
  const { success, error } = useToast();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      error("Please fill in all fields.");
      return;
    }

    setIsSubmitting(true);
    const ok = await signup(name.trim(), email.trim(), password);
    setIsSubmitting(false);

    if (ok) {
      success("Welcome to Shabdkunj! Your reading sanctuary is ready.");
      router.push(redirect);
    } else {
      error("Could not complete registration. Try another email.");
    }
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
            Join the Sanctuary
          </h1>
          <p className="text-xs text-[#7A6552] mt-1">
            Create an account to save books, curate lists, and share stories
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#7A6552] uppercase tracking-wider mb-1">
              Your Name
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Maya Chen"
              className="w-full px-3.5 py-2.5 bg-[#FAF4E8] border border-[#E6D9C3] rounded-lg text-sm text-[#3B2A1E] focus:outline-none focus:border-[#8B5E3C]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#7A6552] uppercase tracking-wider mb-1">
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="maya@example.com"
              className="w-full px-3.5 py-2.5 bg-[#FAF4E8] border border-[#E6D9C3] rounded-lg text-sm text-[#3B2A1E] focus:outline-none focus:border-[#8B5E3C]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#7A6552] uppercase tracking-wider mb-1">
              Create Password
            </label>
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
            className="w-full mt-3 py-3 rounded-full bg-[#B4532A] hover:bg-[#8F3F1C] text-white text-xs font-semibold uppercase tracking-wider transition-colors shadow-sm flex items-center justify-center gap-2"
          >
            <UserPlus className="w-4 h-4" />
            <span>{isSubmitting ? "Creating Account..." : "Create Account"}</span>
          </button>
        </form>

        {/* Login Link */}
        <div className="mt-8 pt-6 border-t border-[#E6D9C3]/70 text-center text-xs text-[#7A6552]">
          <span>Already a member? </span>
          <Link
            href={`/login?redirect=${encodeURIComponent(redirect)}`}
            className="text-[#B4532A] font-semibold hover:underline"
          >
            Log in instead
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#FAF4E8] flex items-center justify-center">Loading...</div>}>
      <SignupForm />
    </Suspense>
  );
}
