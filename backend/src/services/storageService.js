import { mkdirSync, existsSync, readFileSync } from 'fs';
import { join, dirname, extname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const UPLOADS_DIR = join(__dirname, '..', '..', 'uploads');

if (!existsSync(UPLOADS_DIR)) {
  mkdirSync(UPLOADS_DIR, { recursive: true });
}

const MIME_BY_EXT = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.pdf': 'application/pdf',
};

export const StorageService = {
  getUploadsDir() {
    return UPLOADS_DIR;
  },

  buildFileUrl(filename) {
    return `/uploads/${filename}`;
  },

  readFileAsBase64(fileUrl) {
    const filename = fileUrl.replace('/uploads/', '');
    const fullPath = join(UPLOADS_DIR, filename);
    const buffer = readFileSync(fullPath);
    const mimeType = MIME_BY_EXT[extname(filename).toLowerCase()] || 'application/octet-stream';
    return { base64: buffer.toString('base64'), mimeType };
  },
};
