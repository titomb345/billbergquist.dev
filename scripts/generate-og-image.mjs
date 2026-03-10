import sharp from 'sharp';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, '..', 'public');

// 1200x630 OG image with site name, role, and terminal prompt icon
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#0d0d14"/>
      <stop offset="100%" stop-color="#131320"/>
    </linearGradient>
    <linearGradient id="neon" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#00c9a7"/>
      <stop offset="100%" stop-color="#a855f7"/>
    </linearGradient>
    <filter id="glow">
      <feGaussianBlur in="SourceGraphic" stdDeviation="6"/>
    </filter>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)"/>
  <!-- Top accent line -->
  <rect x="0" y="0" width="1200" height="3" fill="url(#neon)" opacity="0.8"/>
  <!-- Terminal prompt icon (scaled) -->
  <g transform="translate(100, 155) scale(0.62)">
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
  </g>
  <!-- Name -->
  <text x="420" y="280" font-family="Arial, Helvetica, sans-serif" font-size="64" font-weight="700" fill="#f0f0f5" letter-spacing="2">Bill Bergquist</text>
  <!-- Role -->
  <text x="420" y="340" font-family="Arial, Helvetica, sans-serif" font-size="28" font-weight="400" fill="#00c9a7" letter-spacing="1">Web Design for Small Businesses</text>
  <!-- URL -->
  <text x="420" y="400" font-family="monospace" font-size="20" fill="#8888aa" letter-spacing="0.5">billbergquist.dev</text>
  <!-- Bottom accent line -->
  <rect x="0" y="627" width="1200" height="3" fill="url(#neon)" opacity="0.8"/>
</svg>`;

await sharp(Buffer.from(svg), { density: 150 })
  .resize(1200, 630)
  .png()
  .toFile(join(publicDir, 'og-image.png'));

console.log('Generated og-image.png');
