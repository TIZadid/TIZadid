import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

// Files starting with "_" (templates) and READMEs are never published.
const files = (base: string, pattern = '*.md') =>
  glob({ base, pattern: [pattern, '!_*.md', '!README.md'] });

const link = z.string().optional().default('');

export const collections = {
  profile: defineCollection({
    loader: files('./content/cv', 'profile.md'),
    schema: z.object({
      name: z.string(),
      title: z.string(),
      tagline: z.string(),
      email: z.string(),
      phone: link,
      location: link,
      linkedin: link,
      github: link,
      instagram: link,
      stats: z.array(z.object({ value: z.number(), suffix: z.string().default(''), label: z.string() })).default([]),
    }),
  }),
  skills: defineCollection({
    loader: files('./content/cv', 'skills.md'),
    schema: z.object({
      groups: z.array(z.object({ label: z.string(), items: z.array(z.string()) })),
      soft: z.array(z.string()).default([]),
    }),
  }),
  experience: defineCollection({
    loader: files('./content/cv/experience'),
    schema: z.object({
      company: z.string(),
      short: z.string().optional(),
      role: z.string(),
      start: z.coerce.string(),
      end: z.coerce.string(),
      location: z.string().optional(),
      blurb: z.string().optional(),
      order: z.number().default(99),
    }),
  }),
  education: defineCollection({
    loader: files('./content/cv/education'),
    schema: z.object({
      degree: z.string(),
      school: z.string(),
      start: z.coerce.string(),
      end: z.coerce.string(),
      detail: z.string().optional(),
      order: z.number().default(99),
    }),
  }),
  businesses: defineCollection({
    loader: files('./content/businesses'),
    schema: z.object({
      name: z.string(),
      role: z.string().optional(),
      url: link,
      status: z.string().optional(),
      blurb: z.string().optional(),
      order: z.number().default(99),
      draft: z.boolean().default(false),
    }),
  }),
  hobbies: defineCollection({
    loader: files('./content/hobbies'),
    schema: z.object({
      title: z.string(),
      kicker: z.string(),
      stat: z.coerce.string(),
      unit: z.string().default(''),
      statLabel: z.string().default(''),
      icon: z.string().default('plus'),
      url: link,
      urlLabel: z.string().default('Open'),
      certificate: link,
      order: z.number().default(99),
    }),
  }),
  projects: defineCollection({
    loader: files('./content/projects'),
    schema: z.object({
      name: z.string(),
      tagline: z.string(),
      url: link,
      repo: link,
      stack: z.array(z.string()).default([]),
      year: z.coerce.string().default(''),
      order: z.number().default(99),
    }),
  }),
};
