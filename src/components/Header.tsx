"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { href, otherLocale, type Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";

type Item = { path: string; label: string };

/**
 * The masthead has three states and they are all one idea: the header is part
 * of the cover until the reader leaves it, then it becomes an instrument, and
 * then it gets out of the way.
 *
 *   top      Nothing but the marque and the links, laid across the page's own
 *            grid with no container of any kind. It belongs to the hero.
 *   compact  The moment the cover is behind you, the same elements gather
 *            into one small framed bar — a hairline, a little depth, and the
 *            ground of whatever section is passing under it.
 *   hidden   Deep in the document and still travelling down, it leaves, so a
 *            pinned scene has the whole screen. Any upward movement returns
 *            it; the gesture that wants it back is the gesture that brings it.
 *
 * None of the three moves the page: the header is fixed, so its own height,
 * width and frame are its own business and nothing below ever reflows.
 */
/** Past this the cover is behind you and the bar collects. */
const COLLECT_AT = 24;
/**
 * And past this it is far enough in to be worth getting out of the way.
 *
 * A share of the viewport rather than a fixed number of pixels: the point is
 * "the reader has left the first screen", and on a phone that is six hundred
 * pixels while on a desktop it is nine hundred. Hiding inside the cover —
 * which a fixed threshold does on every large screen — reads as a glitch.
 */
const hideBelow = () => window.innerHeight * 0.85;
/** Ignore the jitter a trackpad puts out while the hand is still. */
const INTENT = 6;

export default function Header({ locale, t }: { locale: Locale; t: Dictionary }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [collected, setCollected] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [surface, setSurface] = useState<"light" | "ink">("light");
  const headerRef = useRef<HTMLElement>(null);

  const items: Item[] = [
    { path: "/", label: t.nav.home },
    { path: "/about", label: t.nav.about },
    { path: "/services", label: t.nav.services },
    { path: "/projects", label: t.nav.projects },
    { path: "/quality", label: t.nav.qualityShort },
    { path: "/contact", label: t.nav.contact },
  ];

  /**
   * Three things are read from one rAF-throttled pass over the scroll.
   *
   *  · Tone — the header carries no ground of its own at the top of a page,
   *    so it has to be set in whatever the section beneath it is set in.
   *  · Condensed — off the first screen, it draws its own ground and tightens.
   *  · Retracted — travelling *down* well inside the document, it leaves;
   *    any upward movement at all brings it straight back. That is the whole
   *    rule, and it is why it never has to be dismissed: the gesture that
   *    wants it is the gesture that returns it.
   *
   * None of the three changes layout. The header is fixed, so its height is
   * its own business and the page beneath never reflows.
   */
  useEffect(() => {
    let raf = 0;
    let last = window.scrollY;

    const measure = () => {
      raf = 0;
      const y = window.scrollY;
      const probe = (headerRef.current?.offsetHeight ?? 72) * 0.6;
      const sections = document.querySelectorAll<HTMLElement>("[data-surface-section]");
      let current: "light" | "ink" = "light";
      for (const s of sections) {
        const r = s.getBoundingClientRect();
        if (r.top <= probe && r.bottom > probe) {
          const kind = s.dataset.surfaceSection;
          current = kind === "ink" || kind === "teal" || kind === "forest" ? "ink" : "light";
        }
      }
      setSurface(current);
      setCollected(y > COLLECT_AT);

      const moved = y - last;
      if (Math.abs(moved) > INTENT) {
        setHidden(moved > 0 && y > hideBelow());
        last = y;
      }
    };

    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(measure);
    };
    measure();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [pathname]);

  /* Close the overlay on navigation, and lock the page behind it. */
  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    document.documentElement.classList.toggle("lenis-stopped", open);
    document.body.style.overflow = open ? "hidden" : "";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => {
      document.documentElement.classList.remove("lenis-stopped");
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const other = otherLocale(locale);
  const restOfPath = pathname.replace(/^\/(ar|en)/, "") || "";
  /* "/" resolves to /ar, which every other path starts with — so home only
     matches exactly. */
  const isActive = (p: string) => {
    const target = href(p, locale);
    if (p === "/") return pathname === target;
    return pathname === target || pathname.startsWith(`${target}/`);
  };

  return (
    <>
      <a className="skip-link" href="#main">
        {t.nav.skipToContent}
      </a>

      <header
        ref={headerRef}
        className="site-header"
        data-state={collected && !open ? "compact" : "top"}
        data-tone={open ? "ink" : surface}
        data-open={open}
        data-hidden={hidden && !open}
      >
        <div className="page site-header-outer">
          <div className="site-header-inner">
            <Link href={href("/", locale)} className="brand" aria-label={t.meta.siteName}>
              <Image src="/brand/mark.png" alt="" width={40} height={48} className="brand-mark" />
              <span className="brand-text">
                <span className="brand-ar">{locale === "ar" ? "عمران العصر الحديثة" : "Imran Alasr Alhaditha"}</span>
                <span className="brand-sub">{locale === "ar" ? "للمقاولات" : "Contracting Company"}</span>
              </span>
            </Link>

            {/* Everything that is not the marque travels together: the links,
                the switch and the one action are a single cluster held to the
                far side of the page, so the header reads as a mark on one edge
                and a set of controls on the other. It is also what lets the
                whole lot gather into one frame when the cover is behind us —
                a centred nav track cannot collect without the marque and the
                actions sliding past each other on the way. */}
            <div className="site-header-cluster">
              <nav className="site-nav" aria-label={t.nav.menu}>
                {items.map((i) => (
                  <Link
                    key={i.path}
                    href={href(i.path, locale)}
                    className="site-nav-link bracket"
                    data-active={isActive(i.path)}
                  >
                    {i.label}
                  </Link>
                ))}
              </nav>

              <div className="site-header-actions">
                <Link
                  href={`/${other}${restOfPath}`}
                  className="lang-switch bracket"
                  hrefLang={other}
                  aria-label={t.common.switchToEnglish}
                >
                  {t.common.languageSwitch}
                </Link>
                <Link href={href("/quote", locale)} className="btn header-cta">
                  {t.common.sendRequest}
                </Link>
                <button
                  type="button"
                  className="menu-toggle"
                  onClick={() => setOpen((v) => !v)}
                  aria-expanded={open}
                  aria-controls="mobile-menu"
                >
                  <span className="sr-only">{open ? t.nav.close : t.nav.menu}</span>
                  <span className="menu-bars" aria-hidden="true">
                    <i />
                    <i />
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div id="mobile-menu" className="mobile-menu" data-open={open} data-surface="ink" hidden={!open}>
        <div className="page mobile-menu-inner">
          <nav aria-label={t.nav.menu}>
            <ol>
              {items.map((i, n) => (
                <li key={i.path} style={{ ["--i" as string]: n }}>
                  <Link href={href(i.path, locale)} className="bracket">
                    <span className="tabular mobile-menu-index">{String(n + 1).padStart(2, "0")}</span>
                    {i.label}
                  </Link>
                </li>
              ))}
            </ol>
          </nav>
          <div className="mobile-menu-foot">
            <Link href={href("/quote", locale)} className="btn">
              {t.common.sendRequest}
            </Link>
            <Link href={`/${other}${restOfPath}`} className="btn btn-ghost" hrefLang={other}>
              {t.common.languageSwitch}
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
