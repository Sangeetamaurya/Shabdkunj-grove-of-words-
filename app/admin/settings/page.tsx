"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import { useToast } from "@/components/ui/Toast";
import * as api from "@/lib/api";
import { ArrowLeft } from "lucide-react";

export default function SettingsPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { toast, success, error } = useToast();
  const [libraryName, setLibraryName] = useState("Shabdkunj");
  const [registrationOpen, setRegistrationOpen] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!user) {
      router.push("/login?redirect=/admin/settings");
      return;
    }
    if (user.role !== "admin") {
      toast("Only an admin can manage website settings.", "error");
      router.push("/");
      return;
    }
    api.getSettings()
      .then((settings) => {
        setLibraryName(settings.libraryName);
        setRegistrationOpen(settings.registrationOpen);
      })
      .catch((err: Error) => error(err.message || "Could not load settings"))
      .finally(() => setIsLoading(false));
  }, [user, router, toast, error]);

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSaving(true);
    try {
      const saved = await api.updateSettings(libraryName.trim(), registrationOpen);
      setLibraryName(saved.libraryName);
      setRegistrationOpen(saved.registrationOpen);
      success("Website settings saved");
    } catch (err: unknown) {
      error(err instanceof Error ? err.message : "Could not save settings");
    } finally {
      setIsSaving(false);
    }
  };

  if (!user || user.role !== "admin") return null;

  return (
    <div className="min-h-screen bg-[#FAF4E8] text-[#3B2A1E] py-12 px-4 sm:px-6">
      <div className="max-w-xl mx-auto">
        <Link href="/" className="inline-flex items-center gap-2 text-xs text-[#7A6552] hover:text-[#B4532A] mb-6">
          <ArrowLeft className="w-4 h-4" />
          Back
        </Link>
        <h1 className="font-serif text-3xl font-medium mb-8">Website settings</h1>
        {isLoading ? (
          <p className="text-sm text-[#7A6552]">Loading settings...</p>
        ) : (
          <form onSubmit={save} className="bg-[#FFFDF7] border border-[#E6D9C3] rounded-2xl p-6 space-y-5">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#7A6552] mb-1">Library name</label>
              <input
                value={libraryName}
                onChange={(event) => setLibraryName(event.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#FAF4E8] border border-[#E6D9C3] rounded-lg text-sm"
              />
            </div>
            <label className="flex items-center gap-3 text-sm">
              <input
                type="checkbox"
                checked={registrationOpen}
                onChange={(event) => setRegistrationOpen(event.target.checked)}
              />
              Allow new readers to sign up
            </label>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2.5 rounded-full bg-[#182631] text-white text-xs font-semibold uppercase tracking-wider"
            >
              {isSaving ? "Saving..." : "Save settings"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
