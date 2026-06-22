import { mkdirSync, existsSync, readFileSync, writeFileSync } from 'fs';
import { join, dirname, extname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const UPLOADS_DIR = join(__dirname, '..', '..', 'uploads');

if (!existsSync(UPLOADS_DIR)) {
  mkdirSync(UPLOADS_DIR, { recursive: true });
}

let blobPut;

async function ensureBlob() {
  if (!blobPut && process.env.BLOB_READ_WRITE_TOKEN) {
    const mod = await import('@vercel/blob');
    blobPut = mod.put;
  }
  return blobPut;
}

export const StorageService = {
  getUploadsDir() {
    return UPLOADS_DIR;
  },

  async uploadFile(buffer, filename) {
    const put = await ensureBlob();
    if (put) {
      const blob = await put(filename, buffer, { access: 'public' });
      return blob.url;
    }
    const filePath = join(UPLOADS_DIR, filename);
    writeFileSync(filePath, buffer);
    return `/uploads/${filename}`;
  },

  buildFileUrl(filename) {
    return `/uploads/${filename}`;
  },

  async readFileAsBase64(fileUrl) {
    if (fileUrl.startsWith('http')) {
      const response = await fetch(fileUrl);
      const buffer = await response.arrayBuffer();
      const mimeType = response.headers.get('content-type') || 'application/octet-stream';
      return { base64: Buffer.from(buffer).toString('base64'), mimeType };
    }
    const filename = fileUrl.replace('/uploads/', '');
    const fullPath = join(UPLOADS_DIR, filename);
    const buffer = readFileSync(fullPath);
    const mimeType = MIME_BY_EXT[extname(filename).toLowerCase()] || 'application/octet-stream';
    return { base64: buffer.toString('base64'), mimeType };
  },
};

const MIME_BY_EXT = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.pdf': 'application/pdf',
};
