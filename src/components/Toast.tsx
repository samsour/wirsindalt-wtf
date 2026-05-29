"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export function Toast({ message }: { message: string | null }) {
  const router = useRouter();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!message) return;
    setVisible(true);
    const hide = setTimeout(() => {
      setVisible(false);
      // Clear the toast param from the URL without triggering a navigation
      const url = new URL(window.location.href);
      url.searchParams.delete("toast");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      router.replace((url.pathname + (url.searchParams.size > 0 ? "?" + url.searchParams : "")) as any);
    }, 3000);
    return () => clearTimeout(hide);
  }, [message, router]);

  if (!visible) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-ink text-bg px-4 py-3 rounded-xl shadow-lg animate-in fade-in slide-in-from-bottom-2 duration-200">
      <span className="text-accent">✓</span>
      <span className="text-sm font-medium">{message}</span>
    </div>
  );
}
