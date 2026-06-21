import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import zlib from 'zlib';
import pg from 'pg';
import { StorageService } from '../src/services/storageService.js';

function crc32(buf) {
  let c = 0xffffffff;
  const table = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let cc = n;
    for (let k = 0; k < 8; k++) {
      cc = (cc & 1) ? (0xedb88320 ^ (cc >>> 1)) : (cc >>> 1);
    }
    table[n] = cc;
  }
  for (let i = 0; i < buf.length; i++) {
    c = table[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const typeB = Buffer.from(type, 'ascii');
  const crcData = Buffer.concat([typeB, data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(crcData));
  return Buffer.concat([len, typeB, data, crc]);
}

function createPNG(width, height, r, g, b) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 2;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const rawSize = (1 + width * 3) * height;
  const raw = Buffer.alloc(rawSize);
  for (let y = 0; y < height; y++) {
    const rowStart = y * (1 + width * 3);
    raw[rowStart] = 0;
    for (let x = 0; x < width; x++) {
      const offset = rowStart + 1 + x * 3;
      const shade = Math.floor((y / height) * 50);
      raw[offset] = Math.max(0, r + 20 - shade);
      raw[offset + 1] = Math.max(0, g + 20 - shade);
      raw[offset + 2] = Math.max(0, b + 20 - shade);
    }
  }

  const compressed = zlib.deflateSync(raw);
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdrChunk = chunk('IHDR', ihdr);
  const idatChunk = chunk('IDAT', compressed);
  const iendChunk = chunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

async function main() {
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5433/alquilisto' });
  const { rows: properties } = await pool.query('SELECT p.id, p.title FROM properties p WHERE (SELECT count(*) FROM property_photos pp WHERE pp.property_id = p.id) = 0');
  console.log('Properties found:', properties.length);

  const uploadsDir = StorageService.getUploadsDir();
  console.log('Uploads dir:', uploadsDir);

  const colors = [
    [40, 167, 69],   // green
    [0, 123, 255],   // blue
    [111, 66, 193],  // purple
  ];

  for (let i = 0; i < properties.length; i++) {
    const prop = properties[i];
    const c = colors[i] || colors[0];

    for (let p = 0; p < 2; p++) {
      const [r, g, b] = c.map(v => v + p * 15);
      const png = createPNG(400, 300, Math.min(255, r), Math.min(255, g), Math.min(255, b));
      const filename = crypto.randomUUID() + '.png';
      fs.writeFileSync(path.join(uploadsDir, filename), png);

      const fileUrl = '/uploads/' + filename;
      await pool.query(
        'INSERT INTO property_photos (property_id, file_url, position) VALUES ($1, $2, $3)',
        [prop.id, fileUrl, p]
      );
      console.log(`  [${p+1}/2] ${prop.title} → ${filename}`);
    }
  }

  console.log('\nDone!');
  console.log('Photos added:', properties.length * 2);
  await pool.end();
}

main().catch((e) => { console.error(e); process.exit(1); });
