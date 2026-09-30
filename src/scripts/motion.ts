import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import Lenis from 'lenis';

gsap.registerPlugin(ScrollTrigger, SplitText);

const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
const EASE = 'expo.out';

const $$ = <T extends HTMLElement = HTMLElement>(selector: string, root: ParentNode = document) =>
  Array.from(root.querySelectorAll<T>(selector));

let lenis: Lenis | undefined;
let raf: ((time: number) => void) | undefined;
let page: AbortController | undefined;
let clock: number | undefined;

/* ---------- always-on behaviour (works with reduced motion too) ---------- */

function startClock() {
  const format = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Dhaka', hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const tick = () => $$('[data-clock]').forEach((el) => (el.textContent = format.format(new Date())));
  tick();
  clock = window.setInterval(tick, 1000);
}

function bindMenu(signal: AbortSignal) {
  const toggle = document.querySelector<HTMLElement>('[data-menu-toggle]');
  const menu = document.querySelector<HTMLElement>('[data-menu]');
  if (!toggle || !menu) return;
  const set = (open: boolean) => {
    menu.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.textContent = open ? 'Close' : 'Menu';
    if (open) lenis?.stop();
    else lenis?.start();
  };
  toggle.addEventListener('click', () => set(!menu.classList.contains('is-open')), { signal });
  $$('[data-menu-link]').forEach((a) => a.addEventListener('click', () => set(false), { signal }));
  document.addEventListener('keydown', (e) => e.key === 'Escape' && set(false), { signal });
}

function bindCopy(signal: AbortSignal) {
  $$('[data-copy]').forEach((button) =>
    button.addEventListener(
      'click',
      async () => {
        const value = button.dataset.copy ?? '';
        const note = document.querySelector<HTMLElement>('[data-copied]');
        try {
          await navigator.clipboard.writeText(value);
          if (note) note.textContent = 'Copied to clipboard';
        } catch {
          location.href = `mailto:${value}`;
        }
        window.setTimeout(() => note && (note.textContent = ''), 2400);
      },
      { signal },
    ),
  );
}

/* ---------- motion ---------- */

function smoothScroll() {
  lenis = new Lenis({ anchors: true, lerp: 0.11 });
  lenis.on('scroll', ScrollTrigger.update);
  raf = (time) => lenis?.raf(time * 1000);
  gsap.ticker.add(raf);
  gsap.ticker.lagSmoothing(0);
}

function preloader(): Promise<void> {
  const root = document.documentElement;
  if (!root.classList.contains('loading')) return Promise.resolve();
  const panel = document.querySelector<HTMLElement>('.preloader');
  const count = document.querySelector<HTMLElement>('[data-preload-count]');
  const bar = document.querySelector<HTMLElement>('[data-preload-bar]');
  try { sessionStorage.setItem('tiz-seen', '1'); } catch { /* private mode */ }
  if (!panel || !count || !bar) {
    root.classList.remove('loading');
    return Promise.resolve();
  }
  lenis?.stop();
  const state = { n: 0 };
  return new Promise((resolve) => {
    gsap
      .timeline({
        onComplete: () => {
          root.classList.remove('loading');
          lenis?.start();
        },
      })
      .to(state, {
        n: 100, duration: 1.5, ease: 'power2.inOut',
        onUpdate: () => (count.textContent = String(Math.round(state.n)).padStart(3, '0')),
      })
      .to(bar, { scaleX: 1, duration: 1.5, ease: 'power2.inOut' }, 0)
      .add(resolve)
      .to(panel, { yPercent: -100, duration: 0.9, ease: 'expo.inOut' });
  });
}

function reveals() {
  // Lines that rise out of a mask.
  $$('[data-lines]').forEach((group) => {
    const lines = $$('.mask > *', group);
    gsap.to(lines, {
      y: 0, duration: 1.1, ease: EASE, stagger: 0.09,
      delay: group.hasAttribute('data-hero') ? 0.15 : 0,
      scrollTrigger: { trigger: group, start: 'top 88%', once: true },
    });
  });

  // Generic fade and rise; siblings inside the same batch stagger.
  ScrollTrigger.batch('[data-reveal]', {
    start: 'top 98%', once: true,
    onEnter: (els) => gsap.to(els, { opacity: 1, y: 0, duration: 0.9, ease: EASE, stagger: 0.08 }),
  });

  // Paragraph whose words light up as it is scrolled through.
  $$('[data-scrub]').forEach((el) => {
    const split = SplitText.create(el, { type: 'words', aria: 'none' });
    gsap.fromTo(split.words, { opacity: 0.14 }, {
      opacity: 1, ease: 'none', stagger: 0.05,
      scrollTrigger: { trigger: el, start: 'top 80%', end: 'bottom 55%', scrub: 0.6 },
    });
  });

  // Counters.
  $$('[data-count]').forEach((el) => {
    const target = Number(el.dataset.count);
    if (!Number.isFinite(target)) return;
    const state = { n: 0 };
    el.textContent = '0';
    gsap.to(state, {
      n: target, duration: 1.8, ease: 'power3.out',
      onUpdate: () => (el.textContent = String(Math.round(state.n))),
      scrollTrigger: { trigger: el, start: 'top 90%', once: true },
    });
  });

  // Parallax.
  $$('[data-parallax]').forEach((el) => {
    const factor = Number(el.dataset.parallax) || 0.2;
    gsap.to(el, {
      yPercent: -100 * factor, ease: 'none',
      scrollTrigger: { trigger: el.parentElement ?? el, start: 'top bottom', end: 'bottom top', scrub: true },
    });
  });
}

function navOnScroll() {
  const nav = document.querySelector<HTMLElement>('[data-nav]');
  if (!nav) return;
  ScrollTrigger.create({
    start: 120, end: 'max',
    onUpdate: (self) => nav.classList.toggle('is-hidden', self.direction === 1),
    onLeaveBack: () => nav.classList.remove('is-hidden'),
  });
}

function pointerEffects(signal: AbortSignal) {
  if (!finePointer) return;

  // Cursor
  const cursor = document.querySelector<HTMLElement>('.cursor');
  if (cursor) {
    const label = cursor.querySelector('span');
    const x = gsap.quickTo(cursor, 'x', { duration: 0.35, ease: 'power3' });
    const y = gsap.quickTo(cursor, 'y', { duration: 0.35, ease: 'power3' });
    window.addEventListener('pointermove', (e) => {
      cursor.classList.add('is-on');
      x(e.clientX);
      y(e.clientY);
    }, { signal });
    document.addEventListener('pointerover', (e) => {
      const target = e.target as Element;
      const labelled = target.closest<HTMLElement>('[data-cursor]');
      const link = target.closest('a, button, summary, label, input');
      cursor.classList.toggle('is-label', !!labelled);
      cursor.classList.toggle('is-link', !labelled && !!link);
      if (label) label.textContent = labelled?.dataset.cursor ?? '';
    }, { signal });
    document.documentElement.addEventListener('pointerleave', () => cursor.classList.remove('is-on'), { signal });
  }

  // Magnetic elements drift toward the pointer.
  $$('[data-magnetic]').forEach((el) => {
    const x = gsap.quickTo(el, 'x', { duration: 0.5, ease: 'power3' });
    const y = gsap.quickTo(el, 'y', { duration: 0.5, ease: 'power3' });
    el.addEventListener('pointermove', (e) => {
      const box = el.getBoundingClientRect();
      x((e.clientX - box.left - box.width / 2) * 0.35);
      y((e.clientY - box.top - box.height / 2) * 0.35);
    }, { signal });
    el.addEventListener('pointerleave', () => { x(0); y(0); }, { signal });
  });

  // Cards tilt toward the pointer.
  $$('[data-tilt]').forEach((el) => {
    gsap.set(el, { transformPerspective: 1200 });
    const rx = gsap.quickTo(el, 'rotationX', { duration: 0.6, ease: 'power3' });
    const ry = gsap.quickTo(el, 'rotationY', { duration: 0.6, ease: 'power3' });
    el.addEventListener('pointermove', (e) => {
      const box = el.getBoundingClientRect();
      const px = (e.clientX - box.left) / box.width - 0.5;
      const py = (e.clientY - box.top) / box.height - 0.5;
      rx(py * -5);
      ry(px * 6);
      el.style.setProperty('--px', `${(px + 0.5) * 100}%`);
      el.style.setProperty('--py', `${(py + 0.5) * 100}%`);
    }, { signal });
    el.addEventListener('pointerleave', () => { rx(0); ry(0); }, { signal });
  });

  // Hero glow follows the pointer.
  const glow = document.querySelector<HTMLElement>('[data-glow]');
  if (glow) {
    window.addEventListener('pointermove', (e) => {
      glow.style.setProperty('--mx', `${e.clientX}px`);
      glow.style.setProperty('--my', `${e.clientY}px`);
    }, { signal });
  }
}

/* ---------- lifecycle (Astro swaps the page on navigation) ---------- */

function init() {
  (window as unknown as { __tiz: boolean }).__tiz = true;
  page = new AbortController();
  startClock();
  bindMenu(page.signal);
  bindCopy(page.signal);
  if (reduced) return;

  smoothScroll();
  navOnScroll();
  pointerEffects(page.signal);
  preloader().then(reveals);
}

function destroy() {
  page?.abort();
  window.clearInterval(clock);
  ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
  if (raf) gsap.ticker.remove(raf);
  lenis?.destroy();
  lenis = undefined;
}

document.addEventListener('astro:page-load', init);
document.addEventListener('astro:before-swap', destroy);
// The swap replaces <html> attributes, so restore the flag the hidden initial states depend on.
document.addEventListener('astro:after-swap', () => {
  if (!reduced) document.documentElement.classList.add('js');
});
