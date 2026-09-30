# TIZadid Portfolio MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A minimal, heavily animated personal portfolio for Talha Islam Zadid whose every word comes from markdown files he edits, with a CV builder that lets anyone tick what to include and download a text-based, ATS-readable PDF.

**Architecture:** A static Astro site. All copy lives in `content/**.md` (frontmatter for facts, body for prose and bullets) and is read through Astro content collections, so editing a markdown file and pushing is the whole publishing workflow. The CV is assembled at build time into one JSON model, shipped to the `/cv` page, filtered by checkboxes in the browser and drawn into a PDF by jsPDF using real text in a standard font. Cloudflare builds and serves `dist/` on every push.

**Tech Stack:** Astro 5 (static output), TypeScript, GSAP + ScrollTrigger, Lenis, jsPDF, astro-icon with Iconify (Lucide + Simple Icons), Fontsource (Archivo variable, JetBrains Mono variable), Vitest, Wrangler / Cloudflare Workers static assets. Node 22 (`.nvmrc`).

**Spec:** There is no separate spec file. The brief is the owner's request, captured here:

- Site name TIZadid. Sections: CV/experience, businesses, hobbies, projects, CV download.
- Folders of markdown the owner fills in; starts from the CV PDF already in the repo.
- Hobbies: running (Strava link, longest run 50 km), a 228 m bungee jump (certificate to be attached), football every weekend.
- Projects: only Khelbi Naki for now (`../khelbinaki`, live at https://khelbinaki.zlabz.workers.dev).
- CV download: the owner picks what to include; output is a PDF any ATS can read.
- Content is updatable "on the fly".
- Design: minimal, dark charcoal with a single orange accent, oversized type, technical/HUD details (from the four reference images); interactive, animated, professional grade.
- Afterwards: a walkthrough for git and Cloudflare.

## Global Constraints

- Node `22` (written to `.nvmrc`); the machine default is Node 14, so every command runs after `nvm use`.
- Static output only. No server code, no database, no login in the MVP.
- Nothing about Talha is hard-coded in `src/`. Names, dates, links and numbers come from `content/`.
- Facts not in the CV or the brief are never invented. Unknown values (Strava URL, business names, bungee location, certificate file) are empty fields; the UI hides what is empty.
- Palette: background `#131314`, surface `#1c1c1f`, line `#2c2c30`, text `#ece8df`, muted `#8d8a84`, accent `#ff4d14`, paper (inverted band) `#e9e4d8`. One accent only.
- Type: Archivo variable for display and body (display set condensed and heavy, uppercase), JetBrains Mono for labels. No other families.
- CV PDF: one column, Helvetica (built-in), real text, no images, no tables, standard headings `SUMMARY`, `SKILLS`, `WORK EXPERIENCE`, `PROJECTS`, `EDUCATION`, ASCII-safe characters only.
- All motion is disabled under `prefers-reduced-motion: reduce`; content must be fully readable with JavaScript off.
- Layout works from 360 px wide with no horizontal scroll.

## Review Focus

1. A markdown file with an empty body or no bullet lines: the entry still renders and the PDF omits the bullet list instead of printing blanks.
2. Every checkbox unticked in the CV builder: the PDF still contains name and contact line, no empty headings, no crash.
3. Non-ASCII text in content (curly quotes, en dashes, bullets, Bangla): the PDF shows ASCII equivalents or drops the glyph; it never prints garbage bytes.
4. A CV long enough to overflow one page: text continues on a second page; no line is cut at the bottom margin.
5. An empty collection (no businesses yet, no Strava link): the section shows its "empty" state or hides the link; the build does not fail.

Tests for 1 to 4 live in Task 2 and Task 3. Item 5 is checked by the build in Task 5.

---

## File Structure

```
content/                         the only place the owner edits
  README.md                      how to add and edit entries
  cv/profile.md                  name, title, contacts; body = summary
  cv/skills.md                   skill groups in frontmatter
  cv/experience/*.md             one job per file; body = bullets
  cv/education/*.md              one degree per file
  businesses/*.md                one business per file (_template.md is ignored)
  hobbies/running.md | bungee.md | football.md
  projects/khelbinaki.md
public/
  certificates/                  bungee certificate goes here
  favicon.svg
src/
  content.config.ts              collection schemas
  lib/cv/model.ts                types, parseBullets, toAscii, buildCv
  lib/cv/select.ts               Selection type, defaultSelection, applySelection
  lib/cv/pdf.ts                  renderCvPdf
  lib/site.ts                    loads collections once, sorted
  scripts/motion.ts              Lenis, GSAP reveals, cursor, magnetic, counters
  styles/global.css              tokens, base, utilities
  layouts/Base.astro
  components/*.astro             Nav, Preloader, Hero, About, Experience,
                                 Businesses, Projects, OffDuty, CvCta, Footer, SectionHead
  pages/index.astro
  pages/cv.astro                 builder + download
tests/cv/*.test.ts
wrangler.jsonc, astro.config.mjs, .nvmrc, .gitignore
```

---

### Task 1: Scaffold and content

**Files:** Create `package.json`, `astro.config.mjs`, `tsconfig.json`, `.nvmrc`, `.gitignore`, `wrangler.jsonc`, `src/content.config.ts`, everything under `content/`.

**Interfaces:**
- Produces collections `profile`, `skills`, `experience`, `education`, `businesses`, `hobbies`, `projects`.
- Frontmatter contracts:
  - `profile`: `name, title, email, phone?, location?, linkedin?, github?, strava?, tagline`
  - `skills`: `groups: {label, items[]}[]`, `soft: string[]`
  - `experience`: `company, role, start, end, location?, blurb, order`
  - `education`: `degree, school, start, end, detail?, order`
  - `businesses`: `name, role?, url?, status?, blurb, order, draft`
  - `hobbies`: `title, kicker, stat?, unit?, url?, urlLabel?, certificate?, order`
  - `projects`: `name, tagline, url?, repo?, stack[], year, order`

- [ ] **Step 1:** `nvm use 22 && npm init -y && npm i astro gsap lenis jspdf astro-icon @iconify-json/lucide @iconify-json/simple-icons @fontsource-variable/archivo @fontsource-variable/jetbrains-mono && npm i -D vitest typescript @astrojs/check wrangler`
- [ ] **Step 2:** Write config files. `wrangler.jsonc`: `{ "name": "tizadid", "compatibility_date": "2026-09-01", "assets": { "directory": "./dist", "not_found_handling": "404-page" } }`. Scripts: `dev`, `build` (`astro build`), `preview`, `test` (`vitest run`), `deploy` (`astro build && wrangler deploy`).
- [ ] **Step 3:** Write `src/content.config.ts` with the `glob` loader, one collection per folder, pattern `['**/*.md', '!**/_*.md', '!**/README.md']`, zod schemas matching the contracts above (optional fields `.optional()`, `draft` default `false`).
- [ ] **Step 4:** Transcribe the CV PDF into `content/cv/**` verbatim (three jobs, one degree, skills, summary). Write the three hobby files, `projects/khelbinaki.md` from its README, `businesses/_template.md`, and `content/README.md`.
- [ ] **Step 5:** `npx astro sync` — expected: exits 0, no schema errors.

### Task 2: CV model and selection (TDD)

**Files:** Create `src/lib/cv/model.ts`, `src/lib/cv/select.ts`, `tests/cv/model.test.ts`, `tests/cv/select.test.ts`.

**Interfaces — Produces:**

```ts
// model.ts
export interface CvEntry { id: string; heading: string; sub: string; dates: string; blurb?: string; bullets: string[] }
export interface CvModel {
  name: string; title: string; contacts: { id: string; label: string; value: string }[];
  summary: string; skills: { label: string; items: string[] }[]; soft: string[];
  experience: CvEntry[]; projects: CvEntry[]; education: CvEntry[];
}
export function parseBullets(markdown: string): string[]
export function toAscii(text: string): string
// select.ts
export interface Selection { contacts: string[]; summary: boolean; skills: boolean; soft: boolean;
  experience: string[]; bullets: Record<string, number[]>; projects: string[]; education: string[] }
export function defaultSelection(cv: CvModel): Selection
export function applySelection(cv: CvModel, sel: Selection): CvModel
```

- [ ] **Step 1: Failing tests**

```ts
// tests/cv/model.test.ts
import { describe, it, expect } from 'vitest';
import { parseBullets, toAscii } from '../../src/lib/cv/model';

describe('parseBullets', () => {
  it('reads dash and star bullets, trimming', () => {
    expect(parseBullets('- one\n* two  \n\n-   three')).toEqual(['one', 'two', 'three']);
  });
  it('ignores prose and returns [] for empty bodies', () => {
    expect(parseBullets('Just a paragraph.')).toEqual([]);
    expect(parseBullets('')).toEqual([]);
  });
  it('strips inline markdown', () => {
    expect(parseBullets('- **Bold** and [link](https://x.y) `code`')).toEqual(['Bold and link code']);
  });
});

describe('toAscii', () => {
  it('maps typographic characters and drops the rest', () => {
    expect(toAscii('“Hi” – it’s • 50 km… খেলা')).toBe('"Hi" - it\'s - 50 km... ');
  });
});
```

```ts
// tests/cv/select.test.ts
import { describe, it, expect } from 'vitest';
import { applySelection, defaultSelection } from '../../src/lib/cv/select';
import type { CvModel } from '../../src/lib/cv/model';

const cv: CvModel = {
  name: 'T Z', title: 'Engineer',
  contacts: [{ id: 'email', label: 'Email', value: 'a@b.c' }, { id: 'phone', label: 'Phone', value: '+1' }],
  summary: 'Sum', skills: [{ label: 'Languages', items: ['Python'] }], soft: ['Calm'],
  experience: [
    { id: 'a', heading: 'A', sub: 'Dev', dates: '2024 - Present', bullets: ['a0', 'a1', 'a2'] },
    { id: 'b', heading: 'B', sub: 'Dev', dates: '2022', bullets: [] },
  ],
  projects: [{ id: 'p', heading: 'P', sub: '', dates: '2026', bullets: [] }],
  education: [{ id: 'e', heading: 'BSc', sub: 'DU', dates: '2017 - 2021', bullets: [] }],
};

describe('selection', () => {
  it('default keeps everything', () => {
    expect(applySelection(cv, defaultSelection(cv))).toEqual(cv);
  });
  it('drops unticked entries and bullets, preserving order', () => {
    const sel = defaultSelection(cv);
    sel.experience = ['a']; sel.bullets.a = [2, 0]; sel.contacts = ['email'];
    const out = applySelection(cv, sel);
    expect(out.experience.map((e) => e.id)).toEqual(['a']);
    expect(out.experience[0].bullets).toEqual(['a0', 'a2']);
    expect(out.contacts.map((c) => c.id)).toEqual(['email']);
  });
  it('survives everything unticked', () => {
    const out = applySelection(cv, { contacts: [], summary: false, skills: false, soft: false,
      experience: [], bullets: {}, projects: [], education: [] });
    expect(out).toMatchObject({ name: 'T Z', summary: '', skills: [], soft: [], experience: [], projects: [], education: [] });
  });
  it('does not mutate its input', () => {
    const before = JSON.stringify(cv);
    applySelection(cv, { ...defaultSelection(cv), experience: [] });
    expect(JSON.stringify(cv)).toBe(before);
  });
});
```

- [ ] **Step 2:** `npx vitest run` — expected: FAIL, modules not found.
- [ ] **Step 3:** Implement `model.ts` (regex `^\s*[-*]\s+(.*)$` per line; strip `**`, `` ` ``, `[text](url)` → `text`; `toAscii` maps `“”→"`, `‘’→'`, `–—•→-`, `…→...`, non-breaking space → space, then removes anything outside `\x20-\x7E`) and `select.ts` (filter by id membership; bullets filtered by index membership, original order kept; an entry missing from `sel.bullets` keeps all bullets).
- [ ] **Step 4:** `npx vitest run` — expected: all PASS.

### Task 3: ATS PDF renderer (TDD)

**Files:** Create `src/lib/cv/pdf.ts`, `tests/cv/pdf.test.ts`.

**Interfaces:** Consumes `CvModel`, `toAscii`. Produces `export function renderCvPdf(cv: CvModel): jsPDF` (A4, pt units, 48 pt margins, `compress: false`).

- [ ] **Step 1: Failing test**

```ts
import { describe, it, expect } from 'vitest';
import { renderCvPdf } from '../../src/lib/cv/pdf';
import type { CvModel } from '../../src/lib/cv/model';

const base: CvModel = { name: 'Talha Islam Zadid', title: 'Software Engineer',
  contacts: [{ id: 'email', label: 'Email', value: 'a@b.c' }], summary: 'Backend engineer.',
  skills: [{ label: 'Languages', items: ['Python', 'Java'] }], soft: [],
  experience: [{ id: 'a', heading: 'Penta', sub: 'Software Engineer', dates: '2024 - Present', bullets: ['Built “APIs” – fast'] }],
  projects: [], education: [] };
const raw = (cv: CvModel) => renderCvPdf(cv).output();

describe('renderCvPdf', () => {
  it('writes real text with standard headings in reading order', () => {
    const out = raw(base);
    expect(out.startsWith('%PDF-')).toBe(true);
    const at = (s: string) => out.indexOf(s);
    expect(at('Talha Islam Zadid')).toBeGreaterThan(-1);
    expect(at('SUMMARY')).toBeLessThan(at('SKILLS'));
    expect(at('SKILLS')).toBeLessThan(at('WORK EXPERIENCE'));
  });
  it('omits headings for empty sections', () => {
    const out = raw({ ...base, summary: '', skills: [], experience: [] });
    for (const h of ['SUMMARY', 'SKILLS', 'WORK EXPERIENCE', 'PROJECTS', 'EDUCATION']) expect(out).not.toContain(h);
    expect(out).toContain('Talha Islam Zadid');
  });
  it('writes ASCII only', () => {
    expect(raw(base)).toContain('Built "APIs" - fast');
  });
  it('flows onto more pages instead of clipping', () => {
    const bullets = Array.from({ length: 120 }, (_, i) => `Line number ${i}`);
    const doc = renderCvPdf({ ...base, experience: [{ ...base.experience[0], bullets }] });
    expect(doc.getNumberOfPages()).toBeGreaterThan(1);
    expect(doc.output()).toContain('Line number 119');
  });
});
```

- [ ] **Step 2:** `npx vitest run tests/cv/pdf.test.ts` — expected: FAIL, module not found.
- [ ] **Step 3:** Implement with a cursor `y` and one helper `write(text, {size, bold, indent, gap})` that wraps with `doc.splitTextToSize`, and before each line calls `if (y + lineHeight > pageHeight - margin) { doc.addPage(); y = margin }`. Order: name (20 pt bold), title (11 pt), contacts joined with ` | `, then each non-empty section: heading (10.5 pt bold, uppercase, hairline rule beneath), entries as `heading` bold + `sub | dates`, optional blurb, bullets as `- text` indented 10 pt. Every string passes through `toAscii`. Set `doc.setProperties({ title: '<name> - CV', author: name })`.
- [ ] **Step 4:** `npx vitest run` — expected: all PASS.

### Task 4: Design system and layout shell

**Files:** Create `src/styles/global.css`, `src/layouts/Base.astro`, `src/components/{Nav,Preloader,Footer,SectionHead}.astro`, `src/scripts/motion.ts`, `public/favicon.svg`.

**Interfaces — Produces** data attributes that every later component uses; `motion.ts` is the only file that reads them:

| Attribute | Behaviour |
|---|---|
| `data-reveal` | fade and rise 24 px when 85% into the viewport |
| `data-split` | text split into lines that slide up from a mask, staggered |
| `data-count="50"` | number counts from 0 when visible |
| `data-magnetic` | element drifts toward the pointer, springs back on leave |
| `data-cursor="label"` | custom cursor expands and shows the label |
| `data-parallax="0.2"` | vertical scroll parallax at that factor |

- [ ] **Step 1:** `global.css`: tokens from Global Constraints as CSS custom properties; fluid type scale with `clamp()`; `.display` (Archivo, `font-stretch: 62%`, weight 800, uppercase, line-height 0.86, letter-spacing -0.02em); `.label` (JetBrains Mono, 11 px, uppercase, letter-spacing 0.12em, muted); 12-column `.grid`; `.wrap` with `padding-inline: clamp(16px, 4vw, 56px)`; visible focus ring in accent; `@media (prefers-reduced-motion: reduce)` resets.
- [ ] **Step 2:** `Base.astro`: `<head>` with title/description/OG from props, font imports, `<ClientRouter />`; body = `<Preloader />`, `<Nav />`, `<main><slot /></main>`, `<Footer />`, a `.cursor` element, a fixed film-grain overlay (SVG `feTurbulence`, 6% opacity), and `<script>import '../scripts/motion.ts'</script>`.
- [ ] **Step 3:** `Preloader.astro`: full-screen panel, mono counter `000` → `100` with a thin accent progress line, then the panel wipes upward. Shown once per session (`sessionStorage`), skipped under reduced motion.
- [ ] **Step 4:** `Nav.astro`: fixed; left the orange `TIZ` square mark (as in reference 1), right mono links `Work / Ventures / Projects / Off duty / CV` and a live Dhaka clock; hides on scroll down, returns on scroll up; full-screen overlay menu under 760 px.
- [ ] **Step 5:** `motion.ts`: `init()` on `astro:page-load`, `destroy()` on `astro:before-swap` (kills ScrollTriggers and Lenis). Returns early under reduced motion after making all content visible. Content hidden for animation is hidden only via an `html.js` class so it is visible without JavaScript.
- [ ] **Step 6:** `npm run build` — expected: exits 0.

### Task 5: Home page sections

**Files:** Create `src/lib/site.ts`, `src/components/{Hero,About,Experience,Businesses,Projects,OffDuty,CvCta}.astro`, `src/pages/index.astro`.

**Interfaces:** Consumes the collections from Task 1 and attributes from Task 4. `site.ts` produces `getSite(): Promise<{ profile, skills, experience, education, businesses, hobbies, projects }>` with lists sorted by `order` and drafts removed.

- [ ] **Step 1: Hero.** Full viewport. Mono meta row across the top (role, location, availability dot). Name set as three stacked `.display` lines with the last word in accent, revealed by `data-split`. A crosshair and corner ticks as HUD decoration. Bottom row: tagline left, scroll cue right. Background: slow radial accent glow that follows the pointer.
- [ ] **Step 2: About.** `01 / Profile`. Summary at large size with a word-by-word opacity scrub on scroll; skills as mono rows (`label` left, items right) with hairlines; three counters (years in industry, longest run km, bungee m) read from content.
- [ ] **Step 3: Experience.** `02 / Work`. One row per job: dates in mono, company in `.display`, role right. Hover or focus opens the row (CSS grid `0fr` → `1fr`) to show blurb and bullets; the first row is open by default; rows are `<details>`-equivalent buttons with `aria-expanded`.
- [ ] **Step 4: Businesses.** `03 / Ventures`, on the inverted paper band. Cards from `content/businesses`; when the collection is empty a single line: "Entries land here as soon as they are written."
- [ ] **Step 5: Projects.** `04 / Projects`. Large card per project: name in `.display`, tagline, stack chips, year, links; card tilts slightly toward the pointer and its arrow icon is magnetic.
- [ ] **Step 6: OffDuty.** `05 / Off duty`. Three tall panels styled after reference 3 (tall strips, giant numerals, barcode and tick marks): `50 KM` running with Strava button, `228 M` bungee with certificate link, `EVERY WEEKEND` football. Buttons render only when their URL or file exists.
- [ ] **Step 7: CvCta + Footer.** Marquee of `Download CV` in outline type linking to `/cv`; footer with email (click to copy), LinkedIn, GitHub, Strava, and the year.
- [ ] **Step 8:** `npm run build` with the businesses folder holding only `_template.md` — expected: exits 0 and the empty line is in `dist/index.html`.

### Task 6: CV builder page

**Files:** Create `src/pages/cv.astro`, `src/lib/cv/build.ts` (`buildCv(site): CvModel`), `tests/cv/build.test.ts`.

**Interfaces:** Consumes `getSite`, `parseBullets`, `defaultSelection`, `applySelection`, `renderCvPdf`.

- [ ] **Step 1: Failing test** that `buildCv` maps a fixture site into a `CvModel`: contacts only for non-empty fields, `dates` as `start - end`, bullets parsed from `body`, entries in `order`.
- [ ] **Step 2:** Implement; `npx vitest run` — expected: PASS.
- [ ] **Step 3:** Page layout: left column a checklist grouped by section (contacts, summary, skills, soft skills, each job with nested bullet checkboxes, projects, education), with "All" and "None" per group. Right column a live paper-styled preview rendered from the same filtered model. Sticky `Download PDF` button. The model is embedded as `<script type="application/json" id="cv-data">`; jsPDF is dynamically imported on first click. Filename `Talha-Islam-Zadid-CV.pdf` derived from the name.
- [ ] **Step 4:** Selection persists in `localStorage` (wrapped in try/catch) so the owner's last pick is remembered.
- [ ] **Step 5:** Verify for real: build, serve, download with headless Chrome or generate via a Node script, then `pdftotext -layout out.pdf -` — expected: all selected text present, in order, no garbage characters.

### Task 7: Verify and hand over

- [ ] **Step 1:** `npm test && npm run build` — expected: all green.
- [ ] **Step 2:** Screenshot `/` and `/cv` at 1440 and 390 wide with headless Chrome; check for overflow, contrast and empty states.
- [ ] **Step 3:** Write the git and Cloudflare walkthrough for the owner (new GitHub repo under `TIZadid`, personal commit email for this repo, Cloudflare Workers Builds connected to the repo with build `npm run build` and deploy `npx wrangler deploy`, custom domain, and how editing a file on github.com republishes the site).

## Out of scope for the MVP

- An in-browser editor with login. Editing markdown on github.com (or the GitHub mobile app) and committing republishes in about a minute; a CMS can be added later without changing the content format.
- Live Strava activity feed (needs OAuth and a server-side token).
- Blog, analytics, contact form.
