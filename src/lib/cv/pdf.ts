import { jsPDF } from 'jspdf';
import { toAscii, usableExtras, type CvEntry, type CvModel } from './model';

const MARGIN = 48;
const LEADING = 1.38;

interface TextStyle { size?: number; bold?: boolean; indent?: number; gap?: number }

/**
 * Draws the CV as plain, single-column text in a built-in font: the layout
 * applicant tracking systems parse most reliably. No images, tables or columns.
 */
export function renderCvPdf(cv: CvModel): jsPDF {
  const doc = new jsPDF({ unit: 'pt', format: 'a4', compress: false });
  const width = doc.internal.pageSize.getWidth();
  const height = doc.internal.pageSize.getHeight();
  let y = MARGIN;

  const room = (needed: number) => {
    if (y + needed > height - MARGIN) {
      doc.addPage();
      y = MARGIN;
    }
  };

  const write = (text: string, { size = 10, bold = false, indent = 0, gap = 0 }: TextStyle = {}) => {
    const clean = toAscii(text).trim();
    if (!clean) return;
    doc.setFont('helvetica', bold ? 'bold' : 'normal');
    doc.setFontSize(size);
    const lineHeight = size * LEADING;
    for (const line of doc.splitTextToSize(clean, width - MARGIN * 2 - indent) as string[]) {
      room(lineHeight);
      y += lineHeight;
      doc.text(line, MARGIN + indent, y - size * 0.3);
    }
    y += gap;
  };

  const heading = (title: string) => {
    room(60);
    y += 12;
    write(title, { size: 10.5, bold: true });
    doc.setLineWidth(0.6);
    doc.line(MARGIN, y + 1, width - MARGIN, y + 1);
    y += 6;
  };

  const entries = (title: string, list: CvEntry[]) => {
    if (!list.length) return;
    heading(title);
    for (const e of list) {
      room(40);
      write(e.heading, { size: 10.5, bold: true });
      write([e.sub, e.dates].filter(Boolean).join(' | '));
      if (e.blurb) write(e.blurb);
      for (const bullet of e.bullets) write(`- ${bullet}`, { indent: 10 });
      y += 8;
    }
  };

  doc.setProperties({ title: `${toAscii(cv.name)} - CV`, author: toAscii(cv.name), subject: toAscii(cv.title) });

  write(cv.name, { size: 20, bold: true });
  write(cv.title, { size: 11, gap: 2 });
  write(cv.contacts.map((c) => c.value).join(' | '), { size: 9.5 });

  if (cv.summary) {
    heading('SUMMARY');
    write(cv.summary);
  }
  if (cv.skills.length || cv.soft.length) {
    heading('SKILLS');
    for (const group of cv.skills) write(`${group.label}: ${group.items.join(', ')}`);
    if (cv.soft.length) write(`Soft skills: ${cv.soft.join(', ')}`);
  }
  entries('WORK EXPERIENCE', cv.experience);
  entries('PROJECTS', cv.projects);
  entries('EDUCATION', cv.education);
  for (const extra of usableExtras(cv)) {
    heading(extra.title);
    for (const line of extra.lines) write(line);
  }

  return doc;
}
