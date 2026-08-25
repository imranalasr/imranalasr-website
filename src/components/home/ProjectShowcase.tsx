"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import ProjectLink from "@/components/ProjectLink";
import Seq from "@/components/Seq";
import { href, type Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";

/**
 * غيضٌ من فيض — the archive, resolving into the record.
 *
 * The section is one held scene in two movements, and the whole idea is in
 * the order of them.
 *
 * First the *archive*: photographs from the company's own site folders,
 * scattered across the field at depth, drifting in from beyond the frame.
 * They are unordered, unreadable, and there are more of them than anyone
 * could take in — which is the literal sense of the heading. This is the
 * evidence in the raw, and it is deliberately not information yet.
 *
 * Then the *record*: the scatter converges on one frame in the middle of the
 * sheet and hands over. Where the fragments went, a single project stands —
 * its own photograph at full size, its field, its region, its name, and the
 * work its photographs actually document — and the reader is walked through
 * the five of them one at a time, counted `01 / 05`.
 *
 * What makes it a scene rather than a slideshow is that the reader is never
 * carried past anything: the sheet is pinned, the scroll is the only clock,
 * and every beat — the flight in, the convergence, each hand-over — is a
 * position on it. Stop scrolling and the scene stops with you.
 *
 * Three rules, the same three the rest of the page is built on:
 *
 *  · Nothing readable ever moves under a photograph. The fragments are
 *    decorative, `aria-hidden`, capped well below full opacity, and gone
 *    before the first project's name is on the sheet. A project's own text is
 *    at full strength for the whole of its beat and is never crossed.
 *  · The record is in the HTML. All five projects are rendered as ordinary
 *    articles with ordinary links, in order, before a line of this runs. The
 *    timeline only ever *positions* them.
 *  · Degradation is the authored state. Without JavaScript, under reduced
 *    motion, or on a phone, the scenes are simply a readable stacked list and
 *    the field is not rendered at all — see `data-motion`, which this
 *    component only sets to `scroll` once it has decided to animate.
 */

export type ShowcaseImage = { src: string; w: number; h: number; blur: string; alt: string };

export type ShowcaseProject = {
  slug: string;
  title: string;
  location: string;
  summary: string;
  sector: string | null;
  documented: string[];
  cover: ShowcaseImage;
};

export type ArchiveTile = { src: string; w: number; h: number; blur: string; slug: string };

/* ── The ribbon ─────────────────────────────────────────────────────────
   The archive is laid on a band, not scattered on a disc.

   A disc of photographs is a pile: it has a centre, it sits still, and the
   only thing it can do is arrive. A band has a direction — it comes from
   somewhere and it is going somewhere — which is what lets the field *travel*
   across the sheet while it is being looked at, and what makes the whole
   thing read as one ribbon of record passing the reader rather than as
   sixteen separate pictures.

   The band is a sine wave laid across the full width of the sheet and a
   little beyond both edges, so it is always entering and always leaving and
   never has a first or last photograph on screen. Two waves at different
   rates are summed, which keeps it from reading as a single tidy curve; the
   depth is cycled rather than derived from position, so near and far
   fragments alternate along the band and it has thickness. */

/** How far past each edge the band runs, in percent of the sheet. */
const OVERRUN = 16;
/** Half the band's vertical swing, in percent of the sheet. */
const SWING = 17;

/**
 * A fragment's seat on the band, in percentages of the sheet.
 *
 * Rounded to four places deliberately: these numbers are written into inline
 * styles during server rendering and computed again on the client, and full
 * float precision makes the two disagree — which React reports as a hydration
 * mismatch on every fragment.
 */
function seat(i: number, n: number) {
  const t = i / Math.max(1, n - 1);
  const round = (v: number) => Math.round(v * 1e4) / 1e4;
  /* Depth 1 (far) … 4 (near). Cycled, so the band has thickness at every
     point along it instead of thinning out towards one end. */
  const depth = 1 + ((i * 3) % 4);
  const along = -OVERRUN + t * (100 + OVERRUN * 2);
  const wave = Math.sin(t * Math.PI * 2.35 + 0.55) * 0.72 + Math.sin(t * Math.PI * 4.9 + 2.1) * 0.28;
  return {
    /** Position along the band, 0…1. Drives when it arrives and how far it
        travels while it is held. */
    t: round(t),
    x: round(along),
    y: round(50 + wave * SWING + (depth - 2.5) * 3.4),
    /* Near fragments are larger, which is the whole of the depth cue. */
    w: round(7.6 + depth * 1.6),
    rotate: round(wave * 4.5),
    depth,
  };
}

export default function ProjectShowcase({
  locale,
  t,
  projects,
  archive,
}: {
  locale: Locale;
  t: Dictionary;
  projects: ShowcaseProject[];
  archive: ArchiveTile[];
}) {
  const root = useRef<HTMLElement>(null);
  /** -1 while the archive is still in the air; then the live project. */
  const [at, setAt] = useState(-1);
  const [done, setDone] = useState(false);

  /**
   * Whether the record is staged or simply read as a list.
   *
   * Staged wants a sheet wide enough to hold a photograph beside four lines
   * of scope, tall enough to pin, and a reader who has not asked for less
   * motion. It is state rather than a one-off measurement for two reasons:
   * the answer changes when a window is dragged or a tablet turned, and the
   * archive — sixteen photographs that exist only to be flown across the
   * staged sheet — is then rendered only where it is going to be used, and
   * never shipped to a phone at all.
   */
  const [staged, setStaged] = useState(false);

  const n = projects.length;

  useEffect(() => {
    const room = window.matchMedia("(min-width: 1000px) and (min-height: 660px)");
    const still = window.matchMedia("(prefers-reduced-motion: reduce)");
    const decide = () =>
      setStaged(
        room.matches &&
          !still.matches &&
          !document.documentElement.classList.contains("reduced-motion")
      );

    decide();
    room.addEventListener("change", decide);
    still.addEventListener("change", decide);
    return () => {
      room.removeEventListener("change", decide);
      still.removeEventListener("change", decide);
    };
  }, []);

  useEffect(() => {
    const el = root.current;
    if (!el || n === 0) return;

    if (!staged) {
      el.dataset.motion = "static";
      setAt(0);
      setDone(true);
      return;
    }

    gsap.registerPlugin(ScrollTrigger);
    el.dataset.motion = "scroll";
    setAt(-1);
    setDone(false);

    const ctx = gsap.context(() => {
      const frags = gsap.utils.toArray<HTMLElement>("[data-frag]");
      const scenes = gsap.utils.toArray<HTMLElement>("[data-scene]");
      const deck = el.querySelector<HTMLElement>(".showcase-deck");
      const stage = el.querySelector<HTMLElement>(".showcase-stage");
      if (!scenes.length || !deck || !stage) return;

      /* GSAP's x is screen space; the seats are placed with
         `inset-inline-start`, which mirrors under RTL. Without this the
         field would converge the wrong way round in Arabic. */
      const dir = getComputedStyle(document.documentElement).direction === "rtl" ? -1 : 1;

      /* Where the fragments are handed over: the frame the first project's
         photograph will occupy. Measured rather than assumed, so the
         convergence lands on the picture at every width. */
      const target = () => {
        const f = scenes[0].querySelector<HTMLElement>(".scene-figure");
        const box = (f ?? deck).getBoundingClientRect();
        const field = el.querySelector<HTMLElement>(".showcase-field");
        const ref = (field ?? el).getBoundingClientRect();
        return {
          x: box.left + box.width / 2 - (ref.left + ref.width / 2),
          y: box.top + box.height / 2 - (ref.top + ref.height / 2),
        };
      };

      /** One unit of timeline is one project's beat. */
      const ARCHIVE = 0.85;
      const RESOLVE = 0.5;
      const TAIL = 0.45;
      const total = ARCHIVE + RESOLVE + (n - 1) + TAIL;

      const tl = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
          trigger: stage,
          start: "top top",
          /* Scroll length per beat. A project's beat is a little under one
             screen of scrolling, of which roughly half is dead hold — long
             enough to read the scope lines without the scene feeling like
             it is waiting for you. */
          end: `+=${Math.round(total * 85)}%`,
          scrub: 0.8,
          pin: stage,
          pinSpacing: true,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            const p = self.progress * total;
            /* The count changes over when the incoming photograph is more
               than half into the frame — that is the moment the frame has
               visibly become the next project, rather than the moment the
               tween that will get it there was scheduled. */
            const first = ARCHIVE + RESOLVE * 0.62;
            if (p < first) setAt(-1);
            else setAt(Math.min(n - 1, Math.floor(p - first)));
            setDone(p >= ARCHIVE + RESOLVE + (n - 1) + 0.2);
          },
        },
      });

      /* ── 1. The ribbon runs ────────────────────────────────────────
         The band is already laid across the sheet; what the scroll does is
         *move* it. Every fragment travels the same way — up the band, in the
         reading direction, at a rate set by how near it sits — so the field
         reads as one length of record being drawn past the reader rather
         than as sixteen photographs each doing something of its own.

         Two things separate them, and both are depth rather than noise: the
         near ones travel further along the band and lift further off it, and
         they arrive earlier. Nothing here has its own oscillator. */
      const W = stage.offsetWidth;
      const H = stage.offsetHeight;
      /** How far the ribbon runs while it is being watched, in sheet widths. */
      const RUN = 0.34;

      frags.forEach((frag, i) => {
        const s = seat(i, frags.length);
        const near = s.depth / 4;
        /* Near fragments are carried further, which is the parallax and the
           whole reason the band reads as having thickness in motion. */
        const travel = W * RUN * (0.52 + 0.48 * near) * dir;
        const at = s.t * 0.34;

        tl.fromTo(
          frag,
          {
            xPercent: -50,
            yPercent: -50,
            /* It enters from behind the trailing edge of the sheet, on the
               band, already moving — never from nowhere in the middle. */
            x: -travel * 0.55,
            y: H * 0.05 * (1 - near),
            rotation: s.rotate + 5,
            scale: 0.84,
            opacity: 0,
          },
          {
            opacity: 0.36 + 0.28 * near,
            scale: 1,
            duration: 0.3,
            ease: "power2.out",
          },
          at
        )
          /* and then it simply keeps going, for the whole of the phase */
          .to(
            frag,
            {
              x: travel * 0.45,
              y: -22 * near,
              rotation: s.rotate - 4,
              duration: ARCHIVE - at + 0.1,
              ease: "none",
            },
            at
          );
      });

      /* ── 2. The convergence ─────────────────────────────────────────
         The scatter closes on the frame the first photograph will stand in,
         and gives way there. This is the hinge of the section: the archive
         is not dismissed and then replaced, it is gathered into the thing
         that replaces it. */
      frags.forEach((frag, i) => {
        const s = seat(i, frags.length);
        const near = s.depth / 4;
        /* Measured against the fragment's own seat on the band, because that
           is where its transform is zeroed — the convergence has to land on
           the photograph's frame from wherever the ribbon has carried it. */
        const seatX = () => ((target().x - ((s.x - 50) / 100) * W * dir) * 1);
        const seatY = () => target().y - ((s.y - 50) / 100) * H;
        tl.to(
          frag,
          {
            x: () => seatX() + (0.5 - ((i * 7) % 10) / 10) * 24,
            y: () => seatY() + (0.5 - ((i * 3) % 10) / 10) * 20,
            rotation: 0,
            scale: 0.32,
            opacity: 0,
            duration: RESOLVE * 0.86,
            ease: "power2.inOut",
          },
          ARCHIVE + (1 - near) * 0.1
        );
      });

      /* The head hands the frame over. It has been read — it is the first
         thing in the section and the largest type on the page — and the
         record needs the whole sheet, so it lifts away rather than being
         shrunk into a corner where it would compete with the project's own
         name. It stays in the document; only its frame is given up. */
      tl.to(
        ".showcase-head",
        {
          scale: 0.92,
          y: -46,
          opacity: 0,
          pointerEvents: "none",
          duration: RESOLVE * 0.78,
          ease: "power2.inOut",
        },
        ARCHIVE + 0.04
      )
        .to(
          ".showcase-fieldwash",
          { opacity: 0, duration: RESOLVE * 0.7, ease: "power2.out" },
          ARCHIVE + 0.1
        )
        /* The meter arrives with the thing it counts. */
        .fromTo(
          ".showcase-meter",
          { opacity: 0 },
          { opacity: 1, duration: RESOLVE * 0.6, ease: "power2.out", immediateRender: false },
          ARCHIVE + RESOLVE * 0.5
        );

      /* ── 3. The record, one project at a time ───────────────────────
         Each project owns one unit of scroll. It arrives from a shade
         further away than it will finish, holds still while it is read, and
         hands the frame on. Nothing overlaps: a scene is either arriving,
         held, or leaving, so no two photographs are ever competing to be
         the one on the sheet. */
      scenes.forEach((scene, i) => {
        const figure = scene.querySelector(".scene-figure");
        const body = scene.querySelector(".scene-body");
        /* The base of this project's beat. The first one starts early, up
           inside the convergence, because its photograph *is* what the
           fragments are resolving into — the two are one movement. */
        const base = ARCHIVE + RESOLVE + i;
        const enter = i === 0 ? ARCHIVE + RESOLVE * 0.4 : base - 0.16;
        const leave = base + 0.7;

        tl.fromTo(
          scene,
          { opacity: 0, pointerEvents: "none" },
          { opacity: 1, pointerEvents: "auto", duration: 0.26, ease: "power2.out" },
          enter
        )
          .fromTo(
            figure,
            /* The first rises out of the place the archive gathered; the
               rest arrive from a shade further away than they finish, which
               is a lens settling rather than a slide moving. */
            { scale: i === 0 ? 0.84 : 1.06, opacity: 0 },
            { scale: 1, opacity: 1, duration: i === 0 ? 0.44 : 0.32, ease: "power2.out" },
            enter
          )
          .fromTo(
            body,
            { opacity: 0, y: 24 },
            { opacity: 1, y: 0, duration: 0.3, ease: "power2.out" },
            enter + 0.07
          );

        /* And out again — unless it is the last, which is left standing
           while the tail runs, so the section ends on a project rather than
           on an empty sheet. */
        if (i < n - 1) {
          tl.to(body, { opacity: 0, y: -20, duration: 0.24, ease: "power2.in" }, leave)
            .to(figure, { scale: 0.95, opacity: 0, duration: 0.28, ease: "power2.in" }, leave + 0.03)
            .to(scene, { opacity: 0, pointerEvents: "none", duration: 0.01 }, leave + 0.32);
        }
      });

      /* ── 4. The hold ───────────────────────────────────────────────
         Dead scroll, and the same argument as everywhere else on this page:
         a scrubbed timeline trails the scroll, so without a stretch at the
         end where nothing moves, the last project lands as the section is
         already being released and nobody sees it stand. */
      tl.to({ hold: 0 }, { hold: 1, duration: TAIL }, ARCHIVE + RESOLVE + (n - 1));
    }, el);

    return () => ctx.revert();
  }, [staged, n]);

  if (!n) return null;

  const arrow = locale === "ar" ? "←" : "→";

  return (
    <section
      ref={root}
      className="showcase"
      data-surface="ink"
      data-surface-section="ink"
      data-motion="static"
      data-seam="stone"
      data-chapter="2"
      aria-labelledby="showcase-title"
    >
      <div className="showcase-ground" aria-hidden="true">
        <span className="blueprint-grid showcase-grid" />
        <span className="showcase-wash" />
      </div>

      {/* The stage is what is held on screen. The section is longer than it,
          so the closing line below still gets its own scroll once the scene
          has finished, instead of being crowded into the held frame. */}
      <div className="showcase-stage">
        {/* The archive. Decorative throughout: every photograph in it belongs
            to a project that is named and linked below, so nothing is shown
            here that is not also said in words. */}
        {staged && archive.length > 0 && (
          <div className="showcase-field" aria-hidden="true">
            <span className="showcase-fieldwash" />
            {archive.map((tile, i) => {
              const s = seat(i, archive.length);
              return (
                <figure
                  key={`${tile.slug}-${i}`}
                  className="showcase-frag"
                  data-frag=""
                  data-depth={s.depth}
                  style={{
                    insetInlineStart: `${s.x}%`,
                    top: `${s.y}%`,
                    width: `${s.w}%`,
                    zIndex: s.depth,
                  }}
                >
                  <Image
                    src={tile.src}
                    alt=""
                    width={tile.w}
                    height={tile.h}
                    sizes="16vw"
                    placeholder="blur"
                    blurDataURL={tile.blur}
                    loading="lazy"
                    fetchPriority="low"
                  />
                </figure>
              );
            })}
          </div>
        )}

        <div className="page showcase-inner">
          <header className="showcase-head">
            <p className="eyebrow" data-reveal="up">
              {t.home.projectsEyebrow}
              <Seq n={3} of={t.home.chapters.length} className="eyebrow-seq" />
            </p>
            <h2 id="showcase-title" className="showcase-title" data-reveal="up">
              {t.home.projectsTitle}
            </h2>
            <p className="showcase-lead" data-reveal="up">
              {t.home.projectsLead}
            </p>
            <p className="showcase-archive-label" data-reveal="up">
              <span className="showcase-archive-rule" aria-hidden="true" />
              {t.home.projectsArchiveLabel}
            </p>
          </header>

          {/* The record. Five ordinary articles, in order, each a link to its
              own page — this is the markup a crawler and a reader with no
              script both get, and the timeline above does nothing to it but
              move it about. */}
          <div className="showcase-deck">
            <ol className="showcase-scenes">
              {projects.map((p, i) => (
                <li key={p.slug} className="scene" data-scene={i} data-live={i === at || undefined}>
                  <article className="scene-card">
                    <div className="scene-body">
                      <p className="scene-meta">
                        <Seq n={i + 1} of={n} className="scene-seq" />
                        {p.sector ? <span className="scene-sector">{p.sector}</span> : null}
                        <span className="tabular scene-loc">{p.location}</span>
                      </p>
                      <h3 className="scene-title">
                        <ProjectLink href={href(`/projects/${p.slug}`, locale)} className="scene-link">
                          {p.title}
                        </ProjectLink>
                      </h3>
                      <p className="scene-summary">{p.summary}</p>
                      <p className="scene-scope-label">{t.home.projectsScopeLabel}</p>
                      <ul className="scene-scope">
                        {p.documented.slice(0, 4).map((line) => (
                          <li key={line}>{line}</li>
                        ))}
                      </ul>
                      <span className="scene-cta">
                        {t.common.viewProject}
                        <span aria-hidden="true">{arrow}</span>
                      </span>
                    </div>

                    <span className="figure scene-figure">
                      <Image
                        src={p.cover.src}
                        alt={p.cover.alt}
                        width={p.cover.w}
                        height={p.cover.h}
                        sizes="(max-width: 1000px) 92vw, 54vw"
                        placeholder="blur"
                        blurDataURL={p.cover.blur}
                        style={{ viewTransitionName: `project-${p.slug}` }}
                      />
                      <span className="scene-figure-edge" aria-hidden="true" />
                    </span>
                  </article>
                </li>
              ))}
            </ol>

            {/* The meter: where the reader is in the record, and how much of
                it is left. It reports the staged scene and nothing else — all
                five projects are in the document in full, so a reader who is
                not watching the scene has already been given everything this
                counts. */}
            <div className="showcase-meter" data-done={done} aria-hidden="true">
              <span className="showcase-meter-label">{t.home.projectsRecordLabel}</span>
              <Seq n={Math.max(1, at + 1)} of={n} className="showcase-meter-seq" />
              <span className="showcase-meter-track" aria-hidden="true">
                {projects.map((p, i) => (
                  <span key={p.slug} className="showcase-meter-tick" data-on={i <= at} />
                ))}
              </span>
              <span className="showcase-meter-hint">
                {done ? t.home.projectsDone : t.home.projectsHint}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="page showcase-foot">
        <p className="showcase-foot-note">
          {t.home.projectsMore}{" "}
          <Link href={href("/profile-request", locale)} className="bracket link-bracket showcase-foot-cta">
            {t.home.projectsMoreCta}
            <span aria-hidden="true"> {arrow}</span>
          </Link>
        </p>
        <Link href={href("/projects", locale)} className="btn btn-ghost showcase-foot-btn">
          {t.common.viewAllProjects}
          <span className="arrow" aria-hidden="true">
            {arrow}
          </span>
        </Link>
      </div>
    </section>
  );
}
