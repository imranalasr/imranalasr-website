"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

const INTRO_KEY = "imran-hero-intro";

export default function HeroSplash() {
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const reduced = document.documentElement.classList.contains("reduced-motion");
    let seen = false;
    try {
      seen = window.sessionStorage.getItem(INTRO_KEY) === "1";
    } catch {
      seen = false;
    }

    if (reduced || seen) {
      setHidden(true);
      return;
    }

    try {
      window.sessionStorage.setItem(INTRO_KEY, "1");
    } catch {
      // Private browsing can block sessionStorage; the intro should still play.
    }

    const timer = window.setTimeout(() => setHidden(true), 1650);
    return () => window.clearTimeout(timer);
  }, []);

  if (hidden) return null;

  return (
    <div className="hero-veil" aria-hidden="true">
      <Image
        src="/brand/mark.png"
        alt=""
        width={900}
        height={1070}
        priority
        className="hero-veil-mark"
      />
    </div>
  );
}
