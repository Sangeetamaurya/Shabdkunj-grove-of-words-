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
    api.getUsers()
      .then(setPeople)
      .catch((err: Error) => error(err.message || "Could not load accounts"))
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

  if (!user || user.role !== "admin") return null;

  return (
    <div className="min-h-screen bg-[#FAF4E8] text-[#3B2A1E] py-12 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto">
        <Link href="/" className="inline-flex items-center gap-2 text-xs text-[#7A6552] hover:text-[#B4532A] mb-6">
          <ArrowLeft className="w-4 h-4" />
          Back
        </Link>
        <h1 className="font-serif text-3xl font-medium mb-2">Readers and librarians</h1>
        <p className="text-sm text-[#7A6552] mb-8">Admin accounts stay unchanged. You can move someone between reader and librarian.</p>
        {isLoading ? (
          <p className="text-sm text-[#7A6552]">Loading accounts...</p>
        ) : people.length === 0 ? (
          <p className="text-sm text-[#7A6552]">No accounts yet.</p>
        ) : (
          <div className="bg-[#FFFDF7] border border-[#E6D9C3] rounded-2xl divide-y divide-[#E6D9C3]">
            {people.map((person) => (
              <div key={person.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4">
                <div>
                  <div className="font-medium">{person.name}</div>
                  <div className="text-xs text-[#7A6552]">{person.email}</div>
                </div>
                {person.role === "admin" || person.id === user.id ? (
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#B4532A]">{person.role}</span>
                ) : (
                  <select
                    value={person.role}
                    onChange={(event) => changeRole(person, event.target.value as "user" | "librarian")}
                    className="px-3 py-2 bg-[#FAF4E8] border border-[#E6D9C3] rounded-lg text-sm"
                  >
                    <option value="user">Reader</option>
                    <option value="librarian">Librarian</option>
                  </select>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
