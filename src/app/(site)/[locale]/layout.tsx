import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import { Readex_Pro, IBM_Plex_Sans_Arabic, IBM_Plex_Mono } from "next/font/google";
import "../../globals.css";
import "../../scenes.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import MotionRoot from "@/components/motion/MotionRoot";
import Cursor from "@/components/motion/Cursor";
import WhatsAppFab from "@/components/WhatsAppFab";
import { getDictionary } from "@/i18n/dictionaries";
import { isLocale, localeMeta, locales, type Locale } from "@/i18n/config";
import { siteUrl } from "@/lib/seo";

const display = Readex_Pro({
  subsets: ["arabic", "latin"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-readex",
  display: "swap",
});

const sansArabic = IBM_Plex_Sans_Arabic({
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "600"],
  variable: "--font-plex-ar",
  display: "swap",
});

const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-plex-mono",
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f6f4f1" },
    { media: "(prefers-color-scheme: dark)", color: "#0a1214" },
  ],
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = getDictionary(locale);
  return {
    metadataBase: new URL(siteUrl()),
    title: { default: `${t.meta.siteName} — ${t.meta.tagline}`, template: `%s | ${t.meta.shortName}` },
    description: t.meta.defaultDescription,
    applicationName: t.meta.siteName,
    authors: [{ name: t.meta.siteName }],
    icons: { icon: "/brand/icon.png", apple: "/brand/icon.png" },
    verification: process.env.GOOGLE_SITE_VERIFICATION
      ? { google: process.env.GOOGLE_SITE_VERIFICATION }
      : undefined,
    alternates: {
      canonical: `/${locale}`,
      languages: { ar: "/ar", en: "/en", "x-default": "/ar" },
    },
    openGraph: {
      type: "website",
      siteName: t.meta.siteName,
      title: `${t.meta.siteName} — ${t.meta.tagline}`,
      description: t.meta.defaultDescription,
      locale: localeMeta[locale].ogLocale,
      alternateLocale: localeMeta[locale === "ar" ? "en" : "ar"].ogLocale,
      url: `/${locale}`,
      images: [{ url: "/og.png", width: 1200, height: 630, alt: t.meta.siteName }],
    },
    twitter: { card: "summary_large_image", title: t.meta.siteName, description: t.meta.defaultDescription },
    robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large" } },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const locale = raw as Locale;
  const t = getDictionary(locale);
  const meta = localeMeta[locale];

  return (
    <html
      lang={meta.htmlLang}
      dir={meta.dir}
      className={`no-js ${display.variable} ${sansArabic.variable} ${mono.variable}`}
      suppressHydrationWarning
    >
      <body>
        <MotionRoot />
        <Cursor />
        <Header locale={locale} t={t} />
        <main id="main">{children}</main>
        <Footer locale={locale} />
        <WhatsAppFab locale={locale} t={t} />
      </body>
    </html>
  );
}
