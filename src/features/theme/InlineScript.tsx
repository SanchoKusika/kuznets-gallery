"use client";

/**
 * Inline script that runs during HTML parsing only. On client renders it becomes text/plain,
 * so React doesn't warn about a <script> it would never execute (Next.js "preventing flash" guide).
 */
export function InlineScript({ html }: { html: string }) {
  return (
    <script
      type={typeof window === "undefined" ? "text/javascript" : "text/plain"}
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
