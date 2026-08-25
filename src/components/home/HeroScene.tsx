"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

/**
 * Hero depth.
 *
 * The entrance itself is handled by the shared reveal system, so the headline
 * and the calls to action are in the HTML and on screen immediately — nothing
 * is held behind an overture. What is left for this wrapper is depth: as the
 * page moves on, the setting-out field opens out and the object settles back a
 * little, so the next section arrives *through* the hero rather than after it.
 * It stands down entirely for reduced motion.
 */
export default function HeroScene({ children }: { children: ReactNode }) {
  const root = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    el.dataset.ready = "true";
    if (document.documentElement.classList.contains("reduced-motion")) return;

    gsap.registerPlugin(ScrollTrigger);

    const ctx = gsap.context(() => {
      const scroll = gsap.timeline({
        scrollTrigger: { trigger: el, start: "top top", end: "bottom top", scrub: 0.6 },
      });
      scroll
        .to(".hero-grid", { scale: 1.35, opacity: 0.25, ease: "none", duration: 1 }, 0)
        .to(".hero-stage", { yPercent: -6, ease: "none", duration: 1 }, 0)
        .to(".hero-copy", { yPercent: -12, opacity: 0.25, ease: "none", duration: 1 }, 0);
    }, el);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={root} className="hero" data-surface="ink" data-surface-section="ink" aria-labelledby="hero-title">
      {children}
    </section>
  );
}
