import { describe, it, expect } from 'vitest';
import { renderCvText } from '../../src/lib/cv/text';
import type { CvModel } from '../../src/lib/cv/model';

const cv: CvModel = { name: 'T Z', title: 'Engineer',
  contacts: [{ id: 'email', label: 'Email', value: 'a@b.c' }, { id: 'phone', label: 'Phone', value: '+1' }],
  summary: 'Sum.', skills: [{ label: 'Languages', items: ['Python', 'Java'] }], soft: [],
  experience: [{ id: 'a', heading: 'Penta', sub: 'SE', dates: '2024 - Present', blurb: 'Blurb.', bullets: ['one'] }],
  projects: [], education: [] };

describe('renderCvText', () => {
  it('lays the CV out as plain text', () => {
    expect(renderCvText(cv)).toBe([
      'T Z', 'Engineer', 'a@b.c | +1', '',
      'SUMMARY', 'Sum.', '',
      'SKILLS', 'Languages: Python, Java', '',
      'WORK EXPERIENCE', 'Penta', 'SE | 2024 - Present', 'Blurb.', '- one', '',
    ].join('\n'));
  });
  it('skips empty sections', () => {
    const out = renderCvText({ ...cv, summary: '', skills: [], experience: [] });
    expect(out).toBe('T Z\nEngineer\na@b.c | +1\n');
  });
});
