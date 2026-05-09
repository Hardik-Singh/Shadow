const fs = require('fs');
const path = require('path');
const config = require('../config');
const bus = require('../bus');
const { makeEnvelope } = require('../signal');
const queue = require('../ingest/queue');
const hs = require('../ingest/hyperspell');

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
  chunks.forEach((content, idx) => {
    const env = makeEnvelope({
      type: 'file',
      content,
      meta: { file_name: fileName, chunk_idx: idx, chunk_total: chunks.length },
      userId: config.hyperspell.userId,
    });
    bus.emit('signal', env);
    queue.enqueue('file', () => hs.ingest(env));
  });
  return { fileName, chunks: chunks.length };
}

module.exports = { ingestFile, chunkText };
