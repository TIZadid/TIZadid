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
