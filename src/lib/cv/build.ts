import { parseBullets, type CvEntry, type CvModel } from './model';

interface Doc<T> { id: string; data: T; body?: string }

export interface CvSource {
  profile: { data: { name: string; title: string; email?: string; phone?: string; location?: string; linkedin?: string; github?: string }; body?: string };
  skills: { data: { groups: { label: string; items: string[] }[]; soft: string[] } };
  experience: Doc<{ company: string; role: string; start: string; end: string; location?: string; blurb?: string }>[];
  education: Doc<{ degree: string; school: string; start: string; end: string; detail?: string }>[];
  projects: Doc<{ name: string; tagline?: string; url?: string; year?: string }>[];
}

const bareUrl = (url: string) => url.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '');
const span = (start: string, end: string) => (start === end ? start : `${start} - ${end}`);
const join = (...parts: (string | undefined)[]) => parts.filter(Boolean).join(', ');

export function buildCv(site: CvSource): CvModel {
  const p = site.profile.data;
  const contacts = [
    { id: 'email', label: 'Email', value: p.email ?? '' },
    { id: 'phone', label: 'Phone', value: p.phone ?? '' },
    { id: 'location', label: 'Location', value: p.location ?? '' },
    { id: 'linkedin', label: 'LinkedIn', value: p.linkedin ? bareUrl(p.linkedin) : '' },
    { id: 'github', label: 'GitHub', value: p.github ? bareUrl(p.github) : '' },
  ].filter((c) => c.value);

  const entry = (id: string, heading: string, sub: string, dates: string, blurb: string | undefined, body?: string): CvEntry => ({
    id, heading, sub, dates, ...(blurb ? { blurb } : {}), bullets: parseBullets(body ?? ''),
  });

  return {
    name: p.name,
    title: p.title,
    contacts,
    summary: (site.profile.body ?? '').trim(),
    skills: site.skills.data.groups,
    soft: site.skills.data.soft,
    experience: site.experience.map((e) =>
      entry(e.id, e.data.company, join(e.data.role, e.data.location), span(e.data.start, e.data.end), e.data.blurb, e.body)),
    projects: site.projects.map((e) =>
      entry(e.id, e.data.name, e.data.url ? bareUrl(e.data.url) : '', e.data.year ?? '', e.data.tagline, e.body)),
    education: site.education.map((e) =>
      entry(e.id, e.data.degree, e.data.school, span(e.data.start, e.data.end), e.data.detail, e.body)),
  };
}
