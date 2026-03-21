"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";

const pages = [
  { title: "Getting Started", path: "/docs", keywords: "install setup quickstart" },
  { title: "Terminal", path: "/docs/terminal", keywords: "tui dashboard portfolio agent wizard" },
  { title: "Tunnel", path: "/docs/tunnel", keywords: "wallet sharing policy auth peer host" },
  { title: "Alerts", path: "/docs/alerts", keywords: "price monitor telegram webhook daemon" },
  { title: "Activity Ledger", path: "/docs/activity-ledger", keywords: "ledger audit log history export csv json stats" },
  { title: "Dry Run", path: "/docs/dryrun", keywords: "simulate simulation dryrun swap transfer bridge quote fees" },
  { title: "Reports", path: "/docs/reports", keywords: "report spending portfolio daily weekly monthly summary" },
  { title: "MCP Tools", path: "/docs/mcp", keywords: "tools server proxy owl_tunnel owl_alert owl_ledger owl_dryrun owl_report owl_portfolio" },
  { title: "MoonPay Integration", path: "/docs/integration", keywords: "moonpay mp cli ows skills" },
];

export function Search() {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const results = query.length > 0
    ? pages.filter(
        (p) =>
          p.title.toLowerCase().includes(query.toLowerCase()) ||
          p.keywords.includes(query.toLowerCase())
      )
    : [];

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen(true);
      }
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-bg-card border border-border-dim text-text-muted text-sm hover:border-neon-cyan/30 transition-colors w-52"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.35-4.35" />
        </svg>
        <span className="flex-1 text-left">Search...</span>
        <kbd className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-bg-secondary border border-border-dim text-text-muted">
          Ctrl+K
        </kbd>
      </button>

      {open && (
        <div className="absolute top-full mt-2 left-0 w-72 bg-bg-card border border-border-dim rounded-xl shadow-2xl overflow-hidden z-50">
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search docs..."
            className="w-full px-4 py-3 bg-transparent border-b border-border-dim text-sm text-text-primary placeholder:text-text-muted outline-none"
          />
          <div className="max-h-64 overflow-y-auto">
            {results.length > 0 ? (
              results.map((r) => (
                <button
                  key={r.path}
                  onClick={() => {
                    router.push(r.path);
                    setOpen(false);
                    setQuery("");
                  }}
                  className="w-full text-left px-4 py-2.5 text-sm text-text-secondary hover:text-neon-cyan hover:bg-neon-cyan/5 transition-colors"
                >
                  {r.title}
                </button>
              ))
            ) : query.length > 0 ? (
              <div className="px-4 py-3 text-sm text-text-muted">No results</div>
            ) : (
              pages.map((r) => (
                <button
                  key={r.path}
                  onClick={() => {
                    router.push(r.path);
                    setOpen(false);
                  }}
                  className="w-full text-left px-4 py-2.5 text-sm text-text-secondary hover:text-neon-cyan hover:bg-neon-cyan/5 transition-colors"
                >
                  {r.title}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
