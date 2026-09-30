# Content

Everything the site says comes from the files in this folder. Edit a file,
commit, push — the site rebuilds itself in about a minute.

| Folder | What it feeds | One file is |
|---|---|---|
| `cv/profile.md` | Hero, contact links, CV header. The text under the `---` block is your summary. | you |
| `cv/skills.md` | Skills on the home page and in the CV | the whole list |
| `cv/experience/` | Work section and CV | one job |
| `cv/education/` | CV | one degree |
| `businesses/` | Ventures section | one business |
| `projects/` | Projects section and CV | one project |
| `hobbies/` | Off duty section | one hobby |

## Rules of thumb

- The part between the `---` lines is structured data (names, dates, links).
  The part below is free text.
- In `cv/experience/` and `projects/`, every line starting with `- ` becomes a
  bullet in the CV, and each bullet gets its own checkbox in the CV builder.
- `order` decides the sequence. Lower numbers come first.
- A file whose name starts with `_` is ignored. Use `_template.md` as a starting point.
- Leave a link empty (`url: ""`) and its button simply does not appear.
- Files for download (the bungee certificate, for example) go in
  `public/certificates/` and are linked as `/certificates/<file name>`.
