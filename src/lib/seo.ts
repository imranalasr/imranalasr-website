import type { Metadata } from "next";
import { localeMeta, type Locale } from "@/i18n/config";

export const SITE_URL = "https://imranalasr.sa";

export function siteUrl() {
  return SITE_URL;
}

/** Prevent user-managed content from terminating a JSON-LD script element. */
export function serializeJsonLd(value: unknown) {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}

/**
 * Every page gets a canonical, both hreflang alternates and an x-default that
 * points at Arabic — the site's primary language, not an afterthought.
 */
export function pageMetadata({
  locale,
  path,
  title,
  description,
  images,
}: {
  locale: Locale;
  /** Path WITHOUT the locale prefix, e.g. "/projects/bisha-project" */
  path: string;
  title: string;
  description: string;
  images?: { url: string; width?: number; height?: number; alt?: string }[];
}): Metadata {
  const clean = path === "/" ? "" : path;
  const socialImages = images ?? [{ url: "/og.png", width: 1200, height: 630, alt: title }];
  const otherLocale = locale === "ar" ? "en" : "ar";
  return {
    title,
    description,
    alternates: {
      canonical: `/${locale}${clean}`,
      languages: { ar: `/ar${clean}`, en: `/en${clean}`, "x-default": `/ar${clean}` },
    },
    openGraph: {
      type: "website",
      siteName: locale === "ar" ? "عمران العصر الحديثة" : "Imran Al Asr",
      title,
      description,
      url: `/${locale}${clean}`,
      locale: localeMeta[locale].ogLocale,
      alternateLocale: localeMeta[otherLocale].ogLocale,
      images: socialImages,
    },
    twitter: { card: "summary_large_image", title, description, images: socialImages.map(({ url }) => url) },
  };
}
