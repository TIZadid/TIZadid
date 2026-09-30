import { describe, it, expect } from 'vitest';
import { buildCv } from '../../src/lib/cv/build';

const site = {
  profile: { data: { name: 'T Z', title: 'Engineer', email: 'a@b.c', phone: '', location: 'Dhaka', linkedin: 'https://www.linkedin.com/in/tz/' }, body: '\nSummary text.\n' },
  skills: { data: { groups: [{ label: 'Languages', items: ['Python'] }], soft: ['Calm'] } },
  experience: [{ id: 'penta', data: { company: 'Penta', role: 'SE', start: '2024', end: 'Present', location: 'Remote', blurb: 'Blurb.' }, body: '- one\n- two' }],
  education: [{ id: 'du', data: { degree: 'BSc', school: 'DU', start: '2017', end: '2021', detail: 'CGPA 3.57' }, body: '' }],
  projects: [{ id: 'kn', data: { name: 'KN', tagline: 'Board.', url: 'https://kn.dev', year: '2026' }, body: 'Prose.\n\n- b1' }],
};

describe('buildCv', () => {
  const cv = buildCv(site);
  it('lists only contacts that have a value', () => {
    expect(cv.contacts.map((c) => c.id)).toEqual(['email', 'location', 'linkedin']);
    expect(cv.contacts[2].value).toBe('linkedin.com/in/tz');
  });
  it('maps jobs with dates and parsed bullets', () => {
    expect(cv.experience[0]).toEqual({ id: 'penta', heading: 'Penta', sub: 'SE, Remote', dates: '2024 - Present', blurb: 'Blurb.', bullets: ['one', 'two'] });
  });
  it('collapses equal start and end years', () => {
    const one = buildCv({ ...site, experience: [{ ...site.experience[0], data: { ...site.experience[0].data, end: '2024' } }] });
    expect(one.experience[0].dates).toBe('2024');
  });
  it('maps summary, projects and education', () => {
    expect(cv.summary).toBe('Summary text.');
    expect(cv.projects[0]).toMatchObject({ heading: 'KN', sub: 'kn.dev', dates: '2026', blurb: 'Board.', bullets: ['b1'] });
    expect(cv.education[0]).toMatchObject({ heading: 'BSc', sub: 'DU', dates: '2017 - 2021', blurb: 'CGPA 3.57', bullets: [] });
  });
});
