"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import { useToast } from "@/components/ui/Toast";
import * as api from "@/lib/api";
import { User } from "@/types";
import { ArrowLeft } from "lucide-react";

export default function AdminUsersPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { toast, success, error } = useToast();
  const [people, setPeople] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      router.push("/login?redirect=/admin/users");
      return;
    }
    if (user.role !== "admin") {
      toast("Only an admin can manage accounts.", "error");
      router.push("/");
      return;
    }
    setIsLoading(true);
    setLoadError(null);
    api.getUsers()
      .then(setPeople)
      .catch((err: Error) => {
        const msg = err.message || "Could not load accounts";
        setLoadError(msg);
        error(msg);
      })
      .finally(() => setIsLoading(false));
  }, [user, router, toast, error]);

  const changeRole = async (person: User, role: "user" | "librarian") => {
    try {
      const updated = await api.updateUserRole(person.id, role);
      setPeople((current) => current.map((item) => (item.id === updated.id ? updated : item)));
      success(`${updated.name} is now a ${role === "user" ? "reader" : "librarian"}.`);
    } catch (err: unknown) {
      error(err instanceof Error ? err.message : "Could not change that role");
    }
  };

  const formatDate = (value?: string) => {
    if (!value) return "—";
    const normalized = value.includes("T") ? value : value.replace(" ", "T");
    const date = new Date(normalized);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
  };

  const roleLabel = (role: string) => (role === "librarian" ? "Librarian" : "Reader");

  if (!user || user.role !== "admin") return null;

  return (
    <div className="min-h-screen bg-[#FAF4E8] text-[#3B2A1E] py-12 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto">
        <Link href="/" className="inline-flex items-center gap-2 text-xs text-[#7A6552] hover:text-[#B4532A] mb-6">
          <ArrowLeft className="w-4 h-4" />
          Back
        </Link>
        <h1 className="font-serif text-3xl font-medium mb-2">Readers and librarians</h1>
        <p className="text-sm text-[#7A6552] mb-8">
          Showing registered reader and librarian accounts. Admin and internal accounts are not listed here.
        </p>
        {isLoading ? (
          <p className="text-sm text-[#7A6552]">Loading accounts...</p>
        ) : loadError ? (
          <p className="text-sm text-[#7A6552]">{loadError}</p>
        ) : people.length === 0 ? (
          <p className="text-sm text-[#7A6552]">No reader or librarian accounts yet.</p>
        ) : (
          <div className="bg-[#FFFDF7] border border-[#E6D9C3] rounded-2xl overflow-hidden">
            <div className="hidden sm:grid grid-cols-[1.4fr_1.6fr_0.8fr_1fr_1fr] gap-3 px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-[#7A6552] border-b border-[#E6D9C3] bg-[#FAF4E8]/60">
              <div>Name</div>
              <div>Email</div>
              <div>Role</div>
              <div>Registered</div>
              <div>Change role</div>
            </div>
            <div className="divide-y divide-[#E6D9C3]">
              {people.map((person) => (
                <div key={person.id} className="grid grid-cols-1 sm:grid-cols-[1.4fr_1.6fr_0.8fr_1fr_1fr] gap-2 sm:gap-3 px-5 py-4 items-center">
                  <div className="font-medium">{person.name}</div>
                  <div className="text-xs text-[#7A6552] break-all">{person.email}</div>
                  <div className="text-xs">{roleLabel(person.role)}</div>
                  <div className="text-xs text-[#7A6552]">{formatDate(person.createdAt)}</div>
                  <div>
                    <select
                      value={person.role}
                      onChange={(event) => changeRole(person, event.target.value as "user" | "librarian")}
                      className="w-full sm:w-auto px-3 py-2 bg-[#FAF4E8] border border-[#E6D9C3] rounded-lg text-sm"
                    >
                      <option value="user">Reader</option>
                      <option value="librarian">Librarian</option>
                    </select>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
