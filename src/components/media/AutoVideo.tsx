"use client";

import { useEffect, useRef } from "react";

/**
 * Muted, looping video that only plays while on screen.
 * `muted` is set on the DOM node directly — React doesn't reliably render
 * the attribute, and browsers block autoplay for un-muted media.
 */
export function AutoVideo({
  src,
  poster,
  className,
  controls = false,
}: {
  src: string;
  poster?: string | null;
  className?: string;
  controls?: boolean;
}) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    v.muted = true;
    v.defaultMuted = true;
    const tryPlay = () => v.play().catch(() => {});
    const io = new IntersectionObserver(
      ([e]) => (e.isIntersecting ? tryPlay() : v.pause()),
      { threshold: 0.25 },
    );
    io.observe(v);
    return () => io.disconnect();
  }, [src]);

  return (
    <video
      ref={ref}
      src={src}
      poster={poster ?? undefined}
      className={className}
      loop
      playsInline
      muted
      preload="metadata"
      controls={controls}
      aria-hidden={!controls}
    />
  );
}
