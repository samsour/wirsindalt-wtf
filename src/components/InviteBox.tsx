"use client";

import { useState } from "react";

export function InviteBox({ slug }: { slug: string }) {
  const [copied, setCopied] = useState(false);
  const url = typeof window !== "undefined"
    ? `${window.location.origin}/join/${slug}`
    : `https://vennwhen.app/join/${slug}`;

  return (
    <div className="bg-accent-soft border border-accent/30 rounded-lg p-5 mb-8 flex items-center justify-between gap-4">
      <div>
        <div className="font-mono text-[10px] uppercase tracking-wider text-accent mb-1">✓ Group created</div>
        <div className="font-serif italic text-lg text-accent">Share this link with friends</div>
      </div>
      <div className="flex items-center gap-2 bg-surface rounded-[10px] pl-4 pr-1 py-1 border border-line">
        <span className="font-mono text-xs text-ink truncate max-w-[300px]">{url}</span>
        <button
          onClick={() => {
            navigator.clipboard.writeText(url);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          }}
          className={`text-xs font-medium px-3 py-2 rounded-[7px] transition ${copied ? "bg-accent text-bg" : "bg-ink text-bg hover:bg-black"}`}
        >
          {copied ? "Copied ✓" : "Copy link"}
        </button>
      </div>
    </div>
  );
}
