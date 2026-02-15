import sharp from 'sharp';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, '..', 'public');

// 1200x630 OG image with site name, role, and gem icon
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#0d0d14"/>
      <stop offset="100%" stop-color="#131320"/>
    </linearGradient>
    <linearGradient id="neon" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#00f5ff"/>
      <stop offset="100%" stop-color="#a855f7"/>
    </linearGradient>
    <filter id="glow">
      <feGaussianBlur in="SourceGraphic" stdDeviation="8"/>
    </filter>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)"/>
  <!-- Top accent line -->
  <rect x="0" y="0" width="1200" height="3" fill="url(#neon)" opacity="0.8"/>
  <!-- Gem icon (scaled down) -->
  <g transform="translate(100, 160) scale(0.5)">
    <polygon points="168,72 344,72 440,216 256,448 72,216"
      fill="#00d4ff" opacity="0.15" filter="url(#glow)"/>
    <polygon points="168,72 344,72 304,148 208,148" fill="#55faff"/>
    <polygon points="168,72 208,148 72,216" fill="#00d8e8"/>
    <polygon points="344,72 304,148 440,216" fill="#00b8d0"/>
    <polygon points="208,148 304,148 256,216" fill="#22e8f5"/>
    <polygon points="208,148 72,216 256,216" fill="#10c4d8"/>
    <polygon points="304,148 440,216 256,216" fill="#0098c0"/>
    <polygon points="72,216 256,216 256,448" fill="#6872e8"/>
    <polygon points="440,216 256,216 256,448" fill="#9458e0"/>
    <g stroke="rgba(255,255,255,0.18)" stroke-width="1.5" fill="none">
      <polygon points="168,72 344,72 440,216 256,448 72,216"/>
      <line x1="208" y1="148" x2="304" y2="148"/>
      <line x1="72" y1="216" x2="440" y2="216"/>
      <line x1="168" y1="72" x2="208" y2="148"/>
      <line x1="344" y1="72" x2="304" y2="148"/>
      <line x1="208" y1="148" x2="72" y2="216"/>
      <line x1="304" y1="148" x2="440" y2="216"/>
      <line x1="208" y1="148" x2="256" y2="216"/>
      <line x1="304" y1="148" x2="256" y2="216"/>
      <line x1="256" y1="216" x2="256" y2="448"/>
    </g>
  </g>
  <!-- Name -->
  <text x="420" y="280" font-family="Arial, Helvetica, sans-serif" font-size="64" font-weight="700" fill="#f0f0f5" letter-spacing="2">Bill Bergquist</text>
  <!-- Role -->
  <text x="420" y="340" font-family="Arial, Helvetica, sans-serif" font-size="28" font-weight="400" fill="#00f5ff" letter-spacing="1">Staff Software Engineer</text>
  <!-- URL -->
  <text x="420" y="400" font-family="monospace" font-size="20" fill="#8888aa" letter-spacing="0.5">billbergquist.com</text>
  <!-- Bottom accent line -->
  <rect x="0" y="627" width="1200" height="3" fill="url(#neon)" opacity="0.8"/>
</svg>`;

await sharp(Buffer.from(svg), { density: 150 })
  .resize(1200, 630)
  .png()
  .toFile(join(publicDir, 'og-image.png'));

console.log('Generated og-image.png');
