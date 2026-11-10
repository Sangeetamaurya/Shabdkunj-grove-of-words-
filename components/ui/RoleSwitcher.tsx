"use client";

import React, { useState } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { UserRole } from "@/types";
import { ShieldCheck, UserCheck, BookOpen, LogOut, ChevronUp } from "lucide-react";

export function RoleSwitcher() {
  const { user, switchRole } = useAuthStore();
  const [isOpen, setIsOpen] = useState(false);

  const roles: Array<{
    role: UserRole | "guest";
    name: string;
    label: string;
    icon: React.ReactNode;
  }> = [
    {
      role: "user",
      name: "Amelia Moore",
      label: "User (Reader)",
      icon: <UserCheck className="w-4 h-4 text-emerald-600" />,
    },
    {
      role: "librarian",
      name: "Elena Vance",
      label: "Librarian",
      icon: <BookOpen className="w-4 h-4 text-amber-600" />,
    },
    {
      role: "admin",
      name: "Vikram Malhotra",
      label: "Admin",
      icon: <ShieldCheck className="w-4 h-4 text-[#B4532A]" />,
    },
    {
      role: "guest",
      name: "Logged Out",
      label: "Guest (Visitor)",
      icon: <LogOut className="w-4 h-4 text-stone-500" />,
    },
  ];

  return (
    <div className="fixed bottom-4 left-4 z-40">
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#FFFDF7]/95 border border-[#E6D9C3] shadow-warm text-xs font-medium text-[#3B2A1E] hover:border-[#8B5E3C] transition-all"
          title="Demo switcher for evaluating different roles"
        >
          <span className="w-2 h-2 rounded-full bg-[#B4532A] animate-pulse" />
          <span>Dev Role:</span>
          <span className="font-semibold text-[#B4532A] uppercase tracking-wide">
            {user ? user.role : "Guest"}
          </span>
          <ChevronUp
            className={`w-3.5 h-3.5 transition-transform duration-200 ${
              isOpen ? "rotate-180" : ""
            }`}
          />
        </button>

        {isOpen && (
          <div className="absolute bottom-full left-0 mb-2 w-64 bg-[#FFFDF7] border border-[#E6D9C3] rounded-xl shadow-warm-lg p-2 flex flex-col gap-1 backdrop-blur-md">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-[#7A6552] px-2.5 py-1">
              Switch Active Persona
            </div>
            {roles.map((r) => {
              const isActive =
                r.role === "guest" ? !user : user?.role === r.role;
              return (
                <button
                  key={r.role}
                  onClick={() => {
                    switchRole(r.role);
                    setIsOpen(false);
                  }}
                  className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left text-xs transition-colors ${
                    isActive
                      ? "bg-[#FAF4E8] text-[#3B2A1E] font-semibold border border-[#E6D9C3]"
                      : "text-stone-600 hover:bg-[#FAF4E8]/60"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {r.icon}
                    <div>
                      <div className="font-medium">{r.label}</div>
                      <div className="text-[10px] text-[#7A6552]">{r.name}</div>
                    </div>
                  </div>
                  {isActive && (
                    <span className="text-[10px] text-[#B4532A] font-bold">
                      ACTIVE
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
