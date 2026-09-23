/**
 * Content-integrity tests.
 *
 * These guard the one rule the whole project rests on: nothing appears on the
 * site that is not in an official document. They read the TypeScript sources
 * as text so they need no build step and no test framework beyond node:test.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (p) => fs.readFileSync(path.join(root, p), "utf8");

const servicesSrc = read("src/content/services.ts");
const projectsSrc = read("src/content/projects.ts");
const companySrc = read("src/content/company.ts");
const certsSrc = read("src/content/certifications.ts");
const media = JSON.parse(read("src/content/media.json"));
const dictSrc = read("src/i18n/dictionaries.ts");
const contentResolverSrc = read("src/lib/content.ts");

/* The 19 activity codes printed on the Ministry of Commerce activity file. */
const OFFICIAL_CODES = [
  "410010", "410021", "410030", "410040", "421051", "422060", "431101",
  "431220", "432111", "432112", "432113", "432121", "432122", "432131",
  "432132", "433010", "433061", "439020", "439061",
];

test("every official activity code appears exactly once", () => {
  for (const code of OFFICIAL_CODES) {
    const hits = servicesSrc.match(new RegExp(`code: "${code}"`, "g")) ?? [];
    assert.equal(hits.length, 1, `activity ${code} should appear once, found ${hits.length}`);
  }
});

test("no activity codes beyond the official list", () => {
  const found = [...servicesSrc.matchAll(/code: "(\d{6})"/g)].map((m) => m[1]);
  assert.equal(found.length, OFFICIAL_CODES.length);
  for (const code of found) {
    assert.ok(OFFICIAL_CODES.includes(code), `unexpected activity code ${code}`);
  }
});

test("statutory numbers match the official documents", () => {
  assert.match(companySrc, /commercialRegistration: "1009160349"/);
  assert.match(companySrc, /unifiedNationalNumber: "7043094916"/);
  assert.match(companySrc, /vatNumber: "312731365700003"/);
  assert.match(companySrc, /membershipNumber: "1069063"/);
  assert.match(companySrc, /postalCode: "12836"/);
  assert.match(companySrc, /shortCode: "REMB6228"/);
});

test("operational contact email uses the requests mailbox", () => {
  assert.match(companySrc, /email: "requests@imranalasr\.sa"/);
});

test("public pages fall back to delivered content when CMS overrides are unavailable", () => {
  assert.match(contentResolverSrc, /async function getPublicOverrides<T>\(prefix: string\)/);
  assert.match(contentResolverSrc, /catch \(error\) \{[\s\S]*?return \{\};/);
  for (const call of [
    'getPublicOverrides<ProjectOverride>("project:")',
    'getPublicOverrides<ServiceOverride>("service:")',
    'getPublicOverrides<CredentialOverride>("credential:")',
    'getPublicOverrides<CompanyOverride>("company:")',
    'getPublicOverrides<Record<string, unknown>>("home:")',
  ]) {
    assert.ok(contentResolverSrc.includes(call), `${call} must use the public fallback`);
  }
});

test("certificate registration numbers match the ISO certificates", () => {
  for (const reg of ["AB2602XXIII07-0001", "CD2602XXIII07-0002", "EF2602XXIII07-0003"]) {
    assert.ok(certsSrc.includes(reg), `missing ISO registration number ${reg}`);
  }
  for (const cert of ["CB-MS-1713", "CB-MS-1712", "CB-MS-1720"]) {
    assert.ok(certsSrc.includes(cert), `missing certificate number ${cert}`);
  }
});

test("the Project type declares no client, value, duration or completion field", () => {
  // Only inspect the type definition — prose and alt text may legitimately
  // contain these words; a *field* would mean the site renders such a claim.
  const typeBlock = projectsSrc.slice(projectsSrc.indexOf("export type Project = {"), projectsSrc.indexOf("type MediaEntry"));
  const fields = [...typeBlock.matchAll(/^\s{2}([a-zA-Z]+)[?]?:/gm)].map((m) => m[1].toLowerCase());
  for (const banned of ["client", "value", "contractvalue", "completion", "duration", "startdate", "enddate", "status", "budget"]) {
    assert.ok(!fields.includes(banned), `Project must not declare a "${banned}" field — no document supports it`);
  }
  assert.ok(fields.includes("documented"), "Project should carry the photo-documented list");
});

test("Saudi Contractors Authority membership is not claimed anywhere", () => {
  // Not present in any supplied document, so it must not appear on the site.
  for (const [name, src] of [["certifications", certsSrc], ["dictionaries", dictSrc], ["company", companySrc]]) {
    assert.ok(!/الهيئة السعودية للمقاولين/.test(src), `${name} must not claim SCA membership`);
    assert.ok(!/Saudi Contractors Authority/i.test(src), `${name} must not claim SCA membership`);
  }
});

test("every project has media and every media file exists", () => {
  const slugs = [...projectsSrc.matchAll(/^\s{4}slug: "([a-z0-9-]+)",$/gm)].map((m) => m[1]);
  assert.equal(slugs.length, 5, "expected the five supplied project folders");
  for (const slug of slugs) {
    const entry = media[slug];
    assert.ok(entry, `no media for ${slug}`);
    assert.ok(entry.gallery.length >= 10, `${slug} should carry its full gallery`);
    for (const img of [entry.cover, entry.coverPortrait, ...entry.gallery]) {
      const file = path.join(root, "public", img.src);
      assert.ok(fs.existsSync(file), `missing image file ${img.src}`);
      assert.ok(img.w > 0 && img.h > 0, `missing dimensions for ${img.src}`);
      assert.match(img.blur, /^data:image\/webp;base64,/, `missing blur placeholder for ${img.src}`);
    }
  }
});

test("no image is shared between two projects", () => {
  const seen = new Map();
  for (const [slug, entry] of Object.entries(media)) {
    for (const img of entry.gallery) {
      assert.ok(!seen.has(img.src), `${img.src} appears in both ${seen.get(img.src)} and ${slug}`);
      seen.set(img.src, slug);
      assert.ok(img.src.startsWith(`/projects/${slug}/`), `${img.src} is filed under the wrong project`);
    }
  }
});

test("Arabic and English dictionaries have the same shape", () => {
  const keysOf = (block) => [...block.matchAll(/^\s{4}([a-zA-Z]+):/gm)].map((m) => m[1]);
  const arBlock = dictSrc.slice(dictSrc.indexOf("const ar = {"), dictSrc.indexOf("const en = {"));
  const enBlock = dictSrc.slice(dictSrc.indexOf("const en = {"), dictSrc.indexOf("export type Dictionary"));
  assert.deepEqual(keysOf(arBlock), keysOf(enBlock), "top-level dictionary sections differ");
});
