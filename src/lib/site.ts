import { getCollection } from 'astro:content';

const byOrder = <T extends { data: { order: number } }>(list: T[]) =>
  [...list].sort((a, b) => a.data.order - b.data.order);

async function load() {
  const [profile] = await getCollection('profile');
  const [skills] = await getCollection('skills');
  if (!profile || !skills) throw new Error('content/cv/profile.md and content/cv/skills.md are required');
  return {
    profile,
    skills,
    experience: byOrder(await getCollection('experience')),
    education: byOrder(await getCollection('education')),
    businesses: byOrder(await getCollection('businesses', (b) => !b.data.draft)),
    hobbies: byOrder(await getCollection('hobbies')),
    projects: byOrder(await getCollection('projects')),
  };
}

let cached: ReturnType<typeof load> | undefined;

/** Loaded once per build; every component shares the result. */
export const getSite = () => (cached ??= load());
