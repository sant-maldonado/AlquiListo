import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import pg from 'pg';
import { StorageService } from '../src/services/storageService.js';

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5433/alquilisto',
});

const tempDir = 'temp-photos';
const files = fs.readdirSync(tempDir).filter((f) => f.endsWith('.jpg')).sort();
console.log('Photo files:', files.length);

const { rows: properties } = await pool.query(
  'SELECT id, title FROM properties ORDER BY created_at'
);
console.log('Properties:', properties.length);

const uploadsDir = StorageService.getUploadsDir();

for (let i = 0; i < properties.length; i++) {
  for (let p = 0; p < 2; p++) {
    const idx = (i * 2 + p) % files.length;
    const src = path.join(tempDir, files[idx]);
    const ext = path.extname(files[idx]);
    const filename = crypto.randomUUID() + ext;
    fs.copyFileSync(src, path.join(uploadsDir, filename));

    await pool.query(
      'INSERT INTO property_photos (property_id, file_url, position) VALUES ($1, $2, $3)',
      [properties[i].id, '/uploads/' + filename, p]
    );
  }
  console.log('  Photos added:', properties[i].title);
}

console.log('Done!');
await pool.end();
