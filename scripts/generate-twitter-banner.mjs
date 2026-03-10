import sharp from 'sharp';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, '..', 'public');

// ── Design tokens (matching site) ──
const BG = '#0d0d14';
const MINT = '#00c9a7';
const ORANGE = '#f06418';
const PURPLE = '#a855f7';
const TEXT = '#f0f0f5';
const TEXT_MUTED = '#8888aa';

// Twitter banner: 1500x500, content on the right to avoid profile pic overlap
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1500" height="500">
  <rect width="1500" height="500" fill="${BG}"/>

  <!-- Grid pattern -->
  <defs>
    <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
      <path d="M 40 0 L 0 0 0 40" fill="none" stroke="${MINT}" stroke-width="0.5" opacity="0.035"/>
    </pattern>
    <filter id="noise">
      <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch"/>
      <feColorMatrix type="saturate" values="0"/>
    </filter>
  </defs>
  <rect width="1500" height="500" fill="url(#grid)"/>
  <rect width="1500" height="500" filter="url(#noise)" opacity="0.03"/>

  <!-- Ambient glow - left side (decorative, behind profile pic area) -->
  <circle cx="200" cy="250" r="200" fill="${MINT}" opacity="0.03"/>
  <circle cx="250" cy="220" r="120" fill="${PURPLE}" opacity="0.025"/>

  <!-- Large decorative chevron - left/center background -->
  <g transform="translate(250, 80)" opacity="0.07">
    <polygon points="0,0 0,50 200,175 0,300 0,350 260,175" fill="${MINT}"/>
  </g>

  <!-- Terminal prompt icon - center -->
  <g transform="translate(550, 120)">
    <!-- Shadow -->
    <polygon points="54,4 54,28 158,76 54,124 54,148 196,76" fill="${PURPLE}" opacity="0.3"/>
    <!-- Chevron -->
    <polygon points="50,0 50,24 154,72 50,120 50,144 192,72" fill="${MINT}"/>
    <!-- Cursor -->
    <rect x="160" y="118" width="72" height="22" rx="3" fill="${ORANGE}"/>
  </g>

  <!-- Name - right side -->
  <text x="830" y="220" font-family="'Trebuchet MS', 'Arial Black', sans-serif" font-size="68" font-weight="900" fill="${TEXT}" letter-spacing="2">Bill Bergquist</text>

  <!-- Role -->
  <text x="834" y="270" font-family="'Segoe UI', Arial, sans-serif" font-size="24" font-weight="300" fill="${MINT}" letter-spacing="3" opacity="0.9">WEB DESIGN FOR SMALL BUSINESSES</text>

  <!-- URL badge -->
  <rect x="834" y="310" width="200" height="32" rx="4" fill="#1a1a2e" stroke="#555566" stroke-width="1"/>
  <text x="934" y="332" font-family="'Courier New', monospace" font-size="14" fill="${TEXT_MUTED}" text-anchor="middle" letter-spacing="1">billbergquist.dev</text>

  <!-- Top accent line -->
  <rect x="0" y="0" width="1500" height="4" fill="${MINT}" opacity="0.6"/>
  <!-- Bottom accent line -->
  <rect x="0" y="496" width="1500" height="4" fill="${MINT}" opacity="0.6"/>
</svg>`;

await sharp(Buffer.from(svg), { density: 150 })
  .resize(1500, 500)
  .png({ quality: 90 })
  .toFile(join(publicDir, 'twitter-banner.png'));

console.log('Generated twitter-banner.png');
