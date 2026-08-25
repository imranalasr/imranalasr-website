"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import Lenis from "lenis";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

/**
 * The single owner of scroll + reveal behaviour.
 *
 * One Lenis instance, one GSAP ticker, one ScrollTrigger registration. Every
 * other component declares intent with data attributes and this root wires it
 * up. Everything is torn down on unmount, and the whole system stands down
 * when the visitor asks for reduced motion.
 */

let registered = false;

/**
 * How far above a jump target to stop.
 *
 * Read off the masthead itself rather than guessed at: it is fixed, it has
 * three heights depending on where the reader is, and a hard-coded offset is
 * wrong in at least one of them — which is how a section heading ends up
 * underneath it. Falls back to the token's own floor if the header is not on
 * the page at all.
 */
function headerClearance() {
  const header = document.querySelector<HTMLElement>(".site-header");
  return (header?.offsetHeight ?? 104) + 16;
}

export default function MotionRoot() {
  const pathname = usePathname();

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("no-js");

    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => root.classList.toggle("reduced-motion", mq.matches);
    apply();
    mq.addEventListener("change", apply);

    if (mq.matches) return () => mq.removeEventListener("change", apply);

    if (!registered) {
      gsap.registerPlugin(ScrollTrigger);
      registered = true;
    }

    const lenis = new Lenis({
      duration: 1.05,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      wheelMultiplier: 0.95,
      touchMultiplier: 1.5,
      // Native scrolling on touch keeps mobile snappy and avoids fighting
      // browser overscroll behaviour.
      syncTouch: false,
    });

    // Make ScrollTrigger read Lenis' virtual scroll position.
    lenis.on("scroll", ScrollTrigger.update);
    const tick = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    // Expose for in-page anchors and the "back to top" affordance.
    (window as unknown as { __lenis?: Lenis }).__lenis = lenis;

    const onAnchor = (e: MouseEvent) => {
      const link = (e.target as HTMLElement)?.closest?.('a[href^="#"]') as HTMLAnchorElement | null;
      if (!link) return;
      const id = link.getAttribute("href")!.slice(1);
      const target = id && document.getElementById(id);
      if (!target) return;
      e.preventDefault();
      lenis.scrollTo(target, { offset: -headerClearance() });
    };
    document.addEventListener("click", onAnchor);

    return () => {
      mq.removeEventListener("change", apply);
      document.removeEventListener("click", onAnchor);
      gsap.ticker.remove(tick);
      lenis.destroy();
      delete (window as unknown as { __lenis?: Lenis }).__lenis;
    };
  }, []);

  /* ── Reveals: re-scanned on every route change ─────────────────────── */
  useEffect(() => {
    if (document.documentElement.classList.contains("reduced-motion")) return;

    const ctx = gsap.context(() => {
      /* Line-masked headings */
      gsap.utils.toArray<HTMLElement>("[data-mask-line]").forEach((el) => {
        const inner = el.querySelector<HTMLElement>(":scope > span");
        if (!inner) return;
        const delay = Number(el.dataset.delay ?? 0);
        gsap.to(inner, {
          y: "0%",
          duration: 1.15,
          ease: "expo.out",
          delay,
          scrollTrigger: { trigger: el, start: "top 88%", once: true },
        });
      });

      /* Generic reveals, grouped so siblings stagger together */
      const groups = new Map<Element, HTMLElement[]>();
      gsap.utils.toArray<HTMLElement>("[data-reveal]").forEach((el) => {
        const key = el.closest("[data-reveal-group]") ?? el.parentElement ?? document.body;
        const list = groups.get(key) ?? [];
        list.push(el);
        groups.set(key, list);
      });

      groups.forEach((els) => {
        els.sort((a, b) => a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1);
        gsap.to(els, {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 1,
          ease: "expo.out",
          stagger: 0.075,
          scrollTrigger: { trigger: els[0], start: "top 90%", once: true },
        });
      });

      /* Depth parallax. data-parallax = strength in px (negative = opposite). */
      gsap.utils.toArray<HTMLElement>("[data-parallax]").forEach((el) => {
        const amount = Number(el.dataset.parallax ?? 60);
        gsap.fromTo(
          el,
          { yPercent: 0 },
          {
            yPercent: amount / 10,
            ease: "none",
            scrollTrigger: { trigger: el.closest("[data-parallax-scope]") ?? el, start: "top bottom", end: "bottom top", scrub: 1 },
          }
        );
      });

      /* Counters — only ever attached to documented numbers. */
      gsap.utils.toArray<HTMLElement>("[data-count]").forEach((el) => {
        const to = Number(el.dataset.count ?? 0);
        const obj = { v: 0 };
        gsap.to(obj, {
          v: to,
          duration: 1.5,
          ease: "expo.out",
          scrollTrigger: { trigger: el, start: "top 92%", once: true },
          onUpdate: () => {
            el.textContent = String(Math.round(obj.v));
          },
        });
      });
    });

    const refresh = window.setTimeout(() => ScrollTrigger.refresh(), 250);

    return () => {
      window.clearTimeout(refresh);
      ctx.revert();
    };
  }, [pathname]);

  /* Reset scroll position on navigation. */
  useEffect(() => {
    const lenis = (window as unknown as { __lenis?: Lenis }).__lenis;
    lenis?.scrollTo(0, { immediate: true });
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}
