import type { CvEntry, CvModel } from './model';

export interface Selection {
  contacts: string[];
  summary: boolean;
  skills: boolean;
  soft: boolean;
  experience: string[];
  /** Entry id -> indexes of the bullets to keep. An entry with no key keeps all of them. */
  bullets: Record<string, number[]>;
  projects: string[];
  education: string[];
}

const ids = (entries: { id: string }[]) => entries.map((e) => e.id);

export function defaultSelection(cv: CvModel): Selection {
  const bullets: Record<string, number[]> = {};
  for (const entry of [...cv.experience, ...cv.projects, ...cv.education]) {
    bullets[entry.id] = entry.bullets.map((_, i) => i);
  }
  return {
    contacts: ids(cv.contacts),
    summary: true,
    skills: true,
    soft: true,
    experience: ids(cv.experience),
    bullets,
    projects: ids(cv.projects),
    education: ids(cv.education),
  };
}

export function applySelection(cv: CvModel, sel: Selection): CvModel {
  const pick = (entries: CvEntry[], keep: string[]): CvEntry[] =>
    entries
      .filter((e) => keep.includes(e.id))
      .map((e) => {
        const kept = sel.bullets[e.id];
        return { ...e, bullets: kept ? e.bullets.filter((_, i) => kept.includes(i)) : [...e.bullets] };
      });
  return {
    name: cv.name,
    title: cv.title,
    contacts: cv.contacts.filter((c) => sel.contacts.includes(c.id)),
    summary: sel.summary ? cv.summary : '',
    skills: sel.skills ? cv.skills : [],
    soft: sel.soft ? cv.soft : [],
    experience: pick(cv.experience, sel.experience),
    projects: pick(cv.projects, sel.projects),
    education: pick(cv.education, sel.education),
  };
}
