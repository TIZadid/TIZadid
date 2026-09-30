export interface CvEntry {
  id: string;
  heading: string;
  sub: string;
  dates: string;
  blurb?: string;
  bullets: string[];
}

export interface CvModel {
  name: string;
  title: string;
  contacts: { id: string; label: string; value: string }[];
  summary: string;
  skills: { label: string; items: string[] }[];
  soft: string[];
  experience: CvEntry[];
  projects: CvEntry[];
  education: CvEntry[];
}

const stripInline = (text: string) =>
  text
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/(\*\*|__|`)/g, '')
    .trim();

/** Every markdown line starting with "- " or "* " becomes one plain-text bullet. */
export function parseBullets(markdown: string): string[] {
  const bullets: string[] = [];
  for (const line of markdown.split('\n')) {
    const match = /^\s*[-*]\s+(.*)$/.exec(line);
    if (match && match[1].trim()) bullets.push(stripInline(match[1]));
  }
  return bullets;
}

const ASCII_MAP: [RegExp, string][] = [
  [/[“”„]/g, '"'],
  [/[‘’]/g, "'"],
  [/[–—•·]/g, '-'],
  [/…/g, '...'],
  [/ /g, ' '],
];

/** The PDF uses a built-in font, so anything outside printable ASCII is mapped or dropped. */
export function toAscii(text: string): string {
  let out = text;
  for (const [pattern, replacement] of ASCII_MAP) out = out.replace(pattern, replacement);
  return out.replace(/[^\x20-\x7E]/g, '');
}
