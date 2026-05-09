const fs = require('fs');
const path = require('path');
const MemoryRepo = require('../repos/memory');

const CHUNK_TARGET = 1000;
const CHUNK_MIN = 200;

function chunkText(text) {
  const paras = text.split(/\n{2,}/g).map((p) => p.replace(/\s+/g, ' ').trim()).filter(Boolean);
  const chunks = [];
  let buf = '';
  for (const p of paras) {
    if ((buf + ' ' + p).length > CHUNK_TARGET && buf.length >= CHUNK_MIN) {
      chunks.push(buf);
      buf = p;
    } else {
      buf = buf ? buf + ' ' + p : p;
    }
  }
  if (buf) chunks.push(buf);
  return chunks;
}

async function extract(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === '.pdf') {
    try {
      const pdfParse = require('pdf-parse');
      const buf = fs.readFileSync(filePath);
      const data = await pdfParse(buf);
      return data.text || '';
    } catch (err) {
      console.warn('[files] pdf-parse missing or failed; install `pdf-parse`', err && err.message);
      return '';
    }
  }
  if (['.txt', '.md', '.markdown', '.json', '.csv'].includes(ext)) {
    return fs.readFileSync(filePath, 'utf8');
  }
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch {
    return '';
  }
}

async function ingestFile(filePath) {
  const fileName = path.basename(filePath);
  const text = await extract(filePath);
  if (!text) {
    console.warn('[files] no text extracted from', fileName);
    return { fileName, chunks: 0 };
  }
  const chunks = chunkText(text);
  // Write a single "ingested" summary line to the memory log (matches dashboard style:
  // 'Acme Inc Series A deck ingested · 22 pages')
  const pages = chunks.length;
  MemoryRepo.create({
    kind: 'file',
    text: `${fileName} ingested · ${pages} chunk${pages === 1 ? '' : 's'}`,
    meta: { file_name: fileName, chunk_total: pages, chunk_idx: -1 },
  });
  // Then write each chunk as its own searchable memory.
  chunks.forEach((content, idx) => {
    MemoryRepo.create({
      kind: 'file',
      text: content,
      meta: { file_name: fileName, chunk_idx: idx, chunk_total: chunks.length },
    });
  });
  return { fileName, chunks: chunks.length };
}

module.exports = { ingestFile, chunkText };
