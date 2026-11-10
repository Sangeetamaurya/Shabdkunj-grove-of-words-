"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";

type ToastType = "success" | "error" | "info";

interface ToastMessage {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
}

interface ToastContextType {
  toast: (message: string, type?: ToastType, title?: string) => void;
  success: (message: string, title?: string) => void;
  error: (message: string, title?: string) => void;
  info: (message: string, title?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    (message: string, type: ToastType = "info", title?: string) => {
      const id = `${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      setToasts((prev) => [...prev, { id, type, title, message }]);
      setTimeout(() => {
        removeToast(id);
      }, 4000);
    },
    [removeToast]
  );

  const success = useCallback(
    (message: string, title?: string) => toast(message, "success", title),
    [toast]
  );
  const error = useCallback(
    (message: string, title?: string) => toast(message, "error", title),
    [toast]
  );
  const info = useCallback(
    (message: string, title?: string) => toast(message, "info", title),
    [toast]
  );

  return (
    <ToastContext.Provider value={{ toast, success, error, info }}>
      {children}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 16, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className={`pointer-events-auto p-4 rounded-xl border shadow-warm-md flex items-start gap-3 backdrop-blur-sm ${
                t.type === "success"
                  ? "bg-[#FFFDF7] border-[#8B5E3C]/30 text-[#3B2A1E]"
                  : t.type === "error"
                  ? "bg-[#FFF9F7] border-red-200 text-red-900"
                  : "bg-[#FFFDF7] border-[#E6D9C3] text-[#3B2A1E]"
              }`}
            >
              {t.type === "success" && (
                <CheckCircle2 className="w-5 h-5 text-[#B4532A] shrink-0 mt-0.5" />
              )}
              {t.type === "error" && (
                <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              )}
              {t.type === "info" && (
                <Info className="w-5 h-5 text-[#8B5E3C] shrink-0 mt-0.5" />
              )}
              <div className="flex-1 text-sm">
                {t.title && <div className="font-semibold mb-0.5">{t.title}</div>}
                <div className="text-stone-700 leading-snug">{t.message}</div>
              </div>
              <button
                onClick={() => removeToast(t.id)}
                className="text-stone-400 hover:text-stone-700 p-0.5 transition-colors"
                aria-label="Close notification"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
