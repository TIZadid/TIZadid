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
    expect(at('SUMMARY')).toBeGreaterThan(-1);
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
