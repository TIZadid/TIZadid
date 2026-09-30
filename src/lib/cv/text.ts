import type { CvEntry, CvModel } from './model';

/** The same CV as renderCvPdf, as plain text for pasting into application forms. */
export function renderCvText(cv: CvModel): string {
  const out: string[] = [cv.name, cv.title];
  const contacts = cv.contacts.map((c) => c.value).join(' | ');
  if (contacts) out.push(contacts);
  out.push('');

  const section = (title: string, lines: string[]) => {
    if (lines.length) out.push(title, ...lines, '');
  };
  const entries = (list: CvEntry[]) =>
    list.flatMap((e, i) => [
      ...(i ? [''] : []),
      e.heading,
      [e.sub, e.dates].filter(Boolean).join(' | '),
      ...(e.blurb ? [e.blurb] : []),
      ...e.bullets.map((b) => `- ${b}`),
    ]);

  section('SUMMARY', cv.summary ? [cv.summary] : []);
  section('SKILLS', [
    ...cv.skills.map((g) => `${g.label}: ${g.items.join(', ')}`),
    ...(cv.soft.length ? [`Soft skills: ${cv.soft.join(', ')}`] : []),
  ]);
  section('WORK EXPERIENCE', entries(cv.experience));
  section('PROJECTS', entries(cv.projects));
  section('EDUCATION', entries(cv.education));

  return out.join('\n');
}
