"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export function NavigationProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const routeKey = `${pathname}?${searchParams.toString()}`;
  const [active, setActive] = useState(false);

  useEffect(() => setActive(false), [routeKey]);

  useEffect(() => {
    const start = () => setActive(true);
    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const target = event.target instanceof Element ? event.target.closest("a[href]") : null;
      if (!(target instanceof HTMLAnchorElement) || target.target === "_blank" || target.hasAttribute("download")) return;
      const next = new URL(target.href, window.location.href);
      if (next.origin !== window.location.origin || next.href === window.location.href) return;
      start();
    };
    const stop = () => setActive(false);
    document.addEventListener("click", onClick, true);
    window.addEventListener("scioly:navigation-start", start);
    window.addEventListener("hashchange", stop);
    window.addEventListener("popstate", stop);
    return () => {
      document.removeEventListener("click", onClick, true);
      window.removeEventListener("scioly:navigation-start", start);
      window.removeEventListener("hashchange", stop);
      window.removeEventListener("popstate", stop);
    };
  }, []);

  useEffect(() => {
    if (!active) return;
    const timeout = window.setTimeout(() => setActive(false), 10000);
    return () => window.clearTimeout(timeout);
  }, [active]);

  return active ? (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-[100] h-1 overflow-hidden bg-cyan-400/15" role="status" aria-label="Loading page">
      <div className="h-full w-1/3 animate-[navigation-progress_1s_ease-in-out_infinite] rounded-r-full bg-cyan-300" />
    </div>
  ) : null;
}
