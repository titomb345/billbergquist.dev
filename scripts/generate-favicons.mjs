import sharp from 'sharp';
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, '..', 'public');

// SVG without rounded corners for raster formats (Apple/Android add their own masking)
const svgRaster = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <defs>
    <filter id="glow">
      <feGaussianBlur in="SourceGraphic" stdDeviation="10"/>
    </filter>
  </defs>
  <rect width="512" height="512" fill="#0d0d14"/>
  <!-- Ambient glow -->
  <g filter="url(#glow)" opacity="0.3">
    <polygon points="96,136 96,180 276,264 96,348 96,392 328,264" fill="#00c9a7"/>
    <rect x="272" y="340" width="152" height="44" fill="#f06418"/>
  </g>
  <!-- Purple shadow -->
  <polygon points="108,148 108,192 288,276 108,360 108,404 340,276" fill="#a855f7" opacity="0.45"/>
  <!-- Main chevron -->
  <polygon points="96,136 96,180 276,264 96,348 96,392 328,264" fill="#00c9a7"/>
  <!-- Cursor block -->
  <rect x="272" y="340" width="152" height="44" rx="4" fill="#f06418"/>
</svg>`;

const svgBuffer = Buffer.from(svgRaster);

// Generate PNGs at all needed sizes
const sizes = [
  { name: 'favicon-16x16.png', size: 16 },
  { name: 'favicon-32x32.png', size: 32 },
  { name: 'apple-touch-icon.png', size: 180 },
  { name: 'android-chrome-192x192.png', size: 192 },
  { name: 'android-chrome-512x512.png', size: 512 },
];

for (const { name, size } of sizes) {
  await sharp(svgBuffer, { density: 400 })
    .resize(size, size)
    .png()
    .toFile(join(publicDir, name));
  console.log(`Generated ${name}`);
}

// Create ICO file (contains 16x16 and 32x32 PNGs)
const png16 = readFileSync(join(publicDir, 'favicon-16x16.png'));
const png32 = readFileSync(join(publicDir, 'favicon-32x32.png'));

function createIco(images) {
  // ICO header: 6 bytes
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);      // Reserved
  header.writeUInt16LE(1, 2);      // Type: ICO
  header.writeUInt16LE(images.length, 4); // Number of images

  // Each directory entry: 16 bytes
  const dirEntries = [];
  let dataOffset = 6 + images.length * 16;

  for (const { data, size } of images) {
    const entry = Buffer.alloc(16);
    entry.writeUInt8(size < 256 ? size : 0, 0);  // Width
    entry.writeUInt8(size < 256 ? size : 0, 1);  // Height
    entry.writeUInt8(0, 2);    // Color palette
    entry.writeUInt8(0, 3);    // Reserved
    entry.writeUInt16LE(1, 4); // Color planes
    entry.writeUInt16LE(32, 6);// Bits per pixel
    entry.writeUInt32LE(data.length, 8);  // Size of image data
    entry.writeUInt32LE(dataOffset, 12);  // Offset to image data
    dirEntries.push(entry);
    dataOffset += data.length;
  }

  return Buffer.concat([header, ...dirEntries, ...images.map(i => i.data)]);
}

const ico = createIco([
  { data: png16, size: 16 },
  { data: png32, size: 32 },
]);
writeFileSync(join(publicDir, 'favicon.ico'), ico);
console.log('Generated favicon.ico');

console.log('Done!');
