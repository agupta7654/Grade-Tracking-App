// Reads a PDF in the browser (nothing is uploaded anywhere) and returns its text as lines.
import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.mjs';
import workerUrl from 'pdfjs-dist/legacy/build/pdf.worker.min.mjs?url';

pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;

export async function extractLines(file) {
  const data = await file.arrayBuffer();
  const pdf = await pdfjs.getDocument({ data }).promise;
  const lines = [];

  for (let p = 1; p <= pdf.numPages; p++) {
    const page = await pdf.getPage(p);
    const content = await page.getTextContent();

    // Group text pieces that sit on the same baseline into rows.
    const rows = [];
    for (const it of content.items) {
      if (!('str' in it) || it.str === '') continue;
      const x = it.transform[4];
      const y = it.transform[5];
      let row = rows.find((r) => Math.abs(r.y - y) < 3);
      if (!row) {
        row = { y, items: [] };
        rows.push(row);
      }
      row.items.push({ x, w: it.width || 0, s: it.str });
    }
    rows.sort((a, b) => b.y - a.y);

    for (const r of rows) {
      r.items.sort((a, b) => a.x - b.x);
      let text = '';
      let prevEnd = null;
      for (const it of r.items) {
        if (prevEnd !== null && it.x - prevEnd > 1.5 && !/\s$/.test(text) && !/^\s/.test(it.s)) text += ' ';
        text += it.s;
        prevEnd = it.x + it.w;
      }
      lines.push(text.replace(/\s+/g, ' ').trim());
    }
    lines.push('');
  }
  return lines;
}
