import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import pg from 'pg';
import { StorageService } from '../src/services/storageService.js';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5433/alquilisto' });

const { rows: props } = await pool.query('SELECT id, title FROM properties ORDER BY created_at');
console.log('Properties:', props.length);

const tempDir = 'temp-photos';
const photos = fs.readdirSync(tempDir).filter(f => f.endsWith('.jpg')).sort();
console.log('Real photos available:', photos.length);

const uploadsDir = StorageService.getUploadsDir();

for (let i = 0; i < props.length; i++) {
  const prop = props[i];
  await pool.query('DELETE FROM property_photos WHERE property_id = $1', [prop.id]);

  for (let p = 0; p < 2; p++) {
    const srcIdx = (i * 2 + p) % photos.length;
    const srcPath = path.join(tempDir, photos[srcIdx]);
    const ext = path.extname(photos[srcIdx]);
    const filename = crypto.randomUUID() + ext;
    fs.copyFileSync(srcPath, path.join(uploadsDir, filename));

    await pool.query(
      'INSERT INTO property_photos (property_id, file_url, position) VALUES ($1, $2, $3)',
      [prop.id, '/uploads/' + filename, p]
    );
    console.log(`  ${prop.title}  photo ${p + 1} <- ${photos[srcIdx]}`);
  }
}

console.log('Done!');
await pool.end();
