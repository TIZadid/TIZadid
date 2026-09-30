import { describe, it, expect } from 'vitest';
import { renderCvText } from '../../src/lib/cv/text';
import { renderCvPdf } from '../../src/lib/cv/pdf';
import type { CvModel } from '../../src/lib/cv/model';

const cv: CvModel = { name: 'T Z', title: 'Engineer',
  contacts: [{ id: 'email', label: 'Email', value: 'a@b.c' }, { id: 'phone', label: 'Phone', value: '+1' }],
  summary: 'Sum.', skills: [{ label: 'Languages', items: ['Python', 'Java'] }], soft: [],
  experience: [{ id: 'a', heading: 'Penta', sub: 'SE', dates: '2024 - Present', blurb: 'Blurb.', bullets: ['one'] }],
  projects: [], education: [],
  extra: [{ title: 'Certifications', lines: ['AWS SAA', '', '  Scrum  '] }] };

describe('renderCvText', () => {
  it('lays the CV out as plain text', () => {
    expect(renderCvText(cv)).toBe([
      'T Z', 'Engineer', 'a@b.c | +1', '',
      'SUMMARY', 'Sum.', '',
      'SKILLS', 'Languages: Python, Java', '',
      'WORK EXPERIENCE', 'Penta', 'SE | 2024 - Present', 'Blurb.', '- one', '',
      'CERTIFICATIONS', 'AWS SAA', 'Scrum', '',
    ].join('\n'));
  });
  it('skips empty sections and added text with no lines', () => {
    const out = renderCvText({ ...cv, summary: '', skills: [], experience: [], extra: [{ title: 'Notes', lines: [' '] }] });
    expect(out).toBe('T Z\nEngineer\na@b.c | +1\n');
  });
});

describe('renderCvPdf with added text', () => {
  it('prints the added section after the standard ones', () => {
    const out = renderCvPdf(cv).output();
    expect(out.indexOf('CERTIFICATIONS')).toBeGreaterThan(out.indexOf('WORK EXPERIENCE'));
    expect(out).toContain('AWS SAA');
  });
  it('falls back to a heading when the title is blank', () => {
    expect(renderCvPdf({ ...cv, extra: [{ title: ' ', lines: ['x'] }] }).output()).toContain('ADDITIONAL');
  });
});
