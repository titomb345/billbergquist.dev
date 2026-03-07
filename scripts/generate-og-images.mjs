import sharp from 'sharp';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { mkdirSync, readdirSync, readFileSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, '..', 'public');
const ogDir = join(publicDir, 'og');
const blogOgDir = join(ogDir, 'blog');
const blogContentDir = join(__dirname, '..', 'src', 'content', 'blog');

mkdirSync(ogDir, { recursive: true });
mkdirSync(blogOgDir, { recursive: true });

// ── Shared design tokens ──
const BG = '#0d0d14';
const BG_SURFACE = '#14141f';
const BG_ELEVATED = '#1a1a2e';
const MINT = '#00c9a7';
const ORANGE = '#f06418';
const MAGENTA = '#d946ef';
const PURPLE = '#a855f7';
const YELLOW = '#f59e0b';
const BLUE = '#4488ff';
const TEXT = '#f0f0f5';
const TEXT_MUTED = '#8888aa';
const TEXT_DIM = '#555566';

// ── Shared SVG fragments ──
function gridPattern(opacity = 0.04) {
  return `
    <defs>
      <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
        <path d="M 40 0 L 0 0 0 40" fill="none" stroke="${MINT}" stroke-width="0.5" opacity="${opacity}"/>
      </pattern>
    </defs>
    <rect width="1200" height="630" fill="url(#grid)"/>`;
}

function noiseTexture() {
  return `
    <filter id="noise">
      <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch"/>
      <feColorMatrix type="saturate" values="0"/>
    </filter>
    <rect width="1200" height="630" filter="url(#noise)" opacity="0.03"/>`;
}

function bottomBar(color) {
  return `<rect x="0" y="624" width="1200" height="6" fill="${color}" opacity="0.6"/>`;
}

function siteBadge() {
  return `
    <rect x="60" y="550" width="180" height="32" rx="4" fill="${BG_ELEVATED}" stroke="${TEXT_DIM}" stroke-width="1"/>
    <text x="150" y="572" font-family="'Courier New', monospace" font-size="14" fill="${TEXT_MUTED}" text-anchor="middle" letter-spacing="1">billbergquist.dev</text>`;
}

function accentDot(x, y, color, r = 4) {
  return `<circle cx="${x}" cy="${y}" r="${r}" fill="${color}" opacity="0.8"/>`;
}

// ── Page definitions ──
const pages = [
  {
    name: 'home',
    svg: () => `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
      <rect width="1200" height="630" fill="${BG}"/>
      ${gridPattern(0.035)}
      ${noiseTexture()}

      <!-- Ambient glow -->
      <circle cx="850" cy="315" r="280" fill="${MINT}" opacity="0.04"/>
      <circle cx="900" cy="280" r="180" fill="${PURPLE}" opacity="0.03"/>

      <!-- Terminal chevron - large decorative -->
      <g transform="translate(680, 140)" opacity="0.08">
        <polygon points="0,0 0,50 200,175 0,300 0,350 260,175" fill="${MINT}"/>
      </g>

      <!-- Terminal prompt icon -->
      <g transform="translate(88, 200)">
        <!-- Shadow -->
        <polygon points="54,4 54,28 158,76 54,124 54,148 196,76" fill="${PURPLE}" opacity="0.3"/>
        <!-- Chevron -->
        <polygon points="50,0 50,24 154,72 50,120 50,144 192,72" fill="${MINT}"/>
        <!-- Cursor -->
        <rect x="160" y="118" width="72" height="22" rx="3" fill="${ORANGE}"/>
      </g>

      <!-- Name -->
      <text x="88" y="430" font-family="'Trebuchet MS', 'Arial Black', sans-serif" font-size="72" font-weight="900" fill="${TEXT}" letter-spacing="2">Bill Bergquist</text>

      <!-- Role -->
      <text x="92" y="476" font-family="'Segoe UI', Arial, sans-serif" font-size="26" font-weight="300" fill="${MINT}" letter-spacing="3" opacity="0.9">STAFF SOFTWARE ENGINEER</text>

      ${siteBadge()}
      ${bottomBar(MINT)}
    </svg>`,
  },
  {
    name: 'about',
    svg: () => `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
      <rect width="1200" height="630" fill="${BG}"/>
      ${gridPattern(0.03)}
      ${noiseTexture()}

      <!-- Ambient glow -->
      <circle cx="900" cy="300" r="250" fill="${MINT}" opacity="0.04"/>

      <!-- Code bracket decoration -->
      <g transform="translate(740, 100)" opacity="0.07">
        <text font-family="'Courier New', monospace" font-size="380" font-weight="700" fill="${MINT}">{ }</text>
      </g>

      <!-- Small decorative code lines -->
      <g opacity="0.12">
        <rect x="800" y="180" width="120" height="3" rx="1" fill="${MINT}"/>
        <rect x="800" y="196" width="200" height="3" rx="1" fill="${PURPLE}"/>
        <rect x="800" y="212" width="160" height="3" rx="1" fill="${TEXT_MUTED}"/>
        <rect x="820" y="228" width="140" height="3" rx="1" fill="${MINT}"/>
        <rect x="820" y="244" width="100" height="3" rx="1" fill="${TEXT_MUTED}"/>
        <rect x="800" y="260" width="180" height="3" rx="1" fill="${PURPLE}"/>
      </g>

      <!-- Title -->
      <text x="88" y="280" font-family="'Trebuchet MS', 'Arial Black', sans-serif" font-size="80" font-weight="900" fill="${TEXT}" letter-spacing="1">About</text>

      <!-- Subtitle -->
      <text x="92" y="340" font-family="'Segoe UI', Arial, sans-serif" font-size="28" fill="${TEXT_MUTED}" letter-spacing="1">Staff Software Engineer</text>
      <text x="92" y="380" font-family="'Segoe UI', Arial, sans-serif" font-size="22" fill="${TEXT_DIM}" letter-spacing="1">14+ years building for the web</text>

      <!-- Skill dots -->
      <g transform="translate(92, 420)">
        ${accentDot(0, 0, MINT, 5)}
        <text x="16" y="5" font-family="'Segoe UI', Arial, sans-serif" font-size="16" fill="${TEXT_MUTED}">React</text>
        ${accentDot(90, 0, ORANGE, 5)}
        <text x="106" y="5" font-family="'Segoe UI', Arial, sans-serif" font-size="16" fill="${TEXT_MUTED}">TypeScript</text>
        ${accentDot(220, 0, PURPLE, 5)}
        <text x="236" y="5" font-family="'Segoe UI', Arial, sans-serif" font-size="16" fill="${TEXT_MUTED}">Astro</text>
        ${accentDot(310, 0, MAGENTA, 5)}
        <text x="326" y="5" font-family="'Segoe UI', Arial, sans-serif" font-size="16" fill="${TEXT_MUTED}">Node.js</text>
      </g>

      ${siteBadge()}
      ${bottomBar(MINT)}
    </svg>`,
  },
  {
    name: 'services',
    svg: () => `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
      <rect width="1200" height="630" fill="${BG}"/>
      ${gridPattern(0.03)}
      ${noiseTexture()}

      <!-- Ambient glow -->
      <circle cx="900" cy="280" r="260" fill="${ORANGE}" opacity="0.04"/>

      <!-- Layout grid decoration -->
      <g transform="translate(720, 140)" opacity="0.1">
        <!-- Browser window frame -->
        <rect x="0" y="0" width="380" height="280" rx="8" fill="none" stroke="${ORANGE}" stroke-width="2"/>
        <rect x="0" y="0" width="380" height="32" rx="8" fill="${ORANGE}" opacity="0.15"/>
        <circle cx="20" cy="16" r="5" fill="${ORANGE}" opacity="0.5"/>
        <circle cx="40" cy="16" r="5" fill="${YELLOW}" opacity="0.5"/>
        <circle cx="60" cy="16" r="5" fill="${MINT}" opacity="0.5"/>
        <!-- Content blocks -->
        <rect x="16" y="48" width="348" height="24" rx="3" fill="${TEXT_MUTED}" opacity="0.3"/>
        <rect x="16" y="84" width="160" height="80" rx="3" fill="${ORANGE}" opacity="0.2"/>
        <rect x="192" y="84" width="172" height="80" rx="3" fill="${ORANGE}" opacity="0.15"/>
        <rect x="16" y="180" width="348" height="16" rx="3" fill="${TEXT_MUTED}" opacity="0.2"/>
        <rect x="16" y="208" width="280" height="16" rx="3" fill="${TEXT_MUTED}" opacity="0.15"/>
        <rect x="16" y="236" width="120" height="28" rx="4" fill="${ORANGE}" opacity="0.25"/>
      </g>

      <!-- Title -->
      <text x="88" y="260" font-family="'Trebuchet MS', 'Arial Black', sans-serif" font-size="72" font-weight="900" fill="${TEXT}" letter-spacing="1">Web Design</text>
      <text x="88" y="340" font-family="'Trebuchet MS', 'Arial Black', sans-serif" font-size="72" font-weight="900" fill="${ORANGE}" letter-spacing="1">Services</text>

      <!-- Location -->
      <g transform="translate(92, 390)">
        <text font-family="'Segoe UI', Arial, sans-serif" font-size="22" fill="${TEXT_MUTED}" letter-spacing="2">DENVER  &#xB7;  LAKEWOOD  &#xB7;  COLORADO</text>
      </g>

      ${siteBadge()}
      ${bottomBar(ORANGE)}
    </svg>`,
  },
  {
    name: 'services-denver',
    svg: () => `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
      <rect width="1200" height="630" fill="${BG}"/>
      ${gridPattern(0.03)}
      ${noiseTexture()}

      <!-- Ambient glow -->
      <circle cx="900" cy="280" r="260" fill="${ORANGE}" opacity="0.04"/>

      <!-- Layout grid decoration -->
      <g transform="translate(720, 140)" opacity="0.1">
        <rect x="0" y="0" width="380" height="280" rx="8" fill="none" stroke="${ORANGE}" stroke-width="2"/>
        <rect x="0" y="0" width="380" height="32" rx="8" fill="${ORANGE}" opacity="0.15"/>
        <circle cx="20" cy="16" r="5" fill="${ORANGE}" opacity="0.5"/>
        <circle cx="40" cy="16" r="5" fill="${YELLOW}" opacity="0.5"/>
        <circle cx="60" cy="16" r="5" fill="${MINT}" opacity="0.5"/>
        <rect x="16" y="48" width="348" height="24" rx="3" fill="${TEXT_MUTED}" opacity="0.3"/>
        <rect x="16" y="84" width="160" height="80" rx="3" fill="${ORANGE}" opacity="0.2"/>
        <rect x="192" y="84" width="172" height="80" rx="3" fill="${ORANGE}" opacity="0.15"/>
        <rect x="16" y="180" width="348" height="16" rx="3" fill="${TEXT_MUTED}" opacity="0.2"/>
        <rect x="16" y="208" width="280" height="16" rx="3" fill="${TEXT_MUTED}" opacity="0.15"/>
        <rect x="16" y="236" width="120" height="28" rx="4" fill="${ORANGE}" opacity="0.25"/>
      </g>

      <!-- Title -->
      <text x="88" y="260" font-family="'Trebuchet MS', 'Arial Black', sans-serif" font-size="72" font-weight="900" fill="${TEXT}" letter-spacing="1">Web Design</text>
      <text x="88" y="340" font-family="'Trebuchet MS', 'Arial Black', sans-serif" font-size="72" font-weight="900" fill="${ORANGE}" letter-spacing="1">in Denver</text>

      <!-- Location -->
      <g transform="translate(92, 390)">
        <text font-family="'Segoe UI', Arial, sans-serif" font-size="22" fill="${TEXT_MUTED}" letter-spacing="2">DENVER, CO  &#xB7;  CUSTOM WEBSITES</text>
      </g>

      ${siteBadge()}
      ${bottomBar(ORANGE)}
    </svg>`,
  },
  {
    name: 'services-boulder',
    svg: () => `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
      <rect width="1200" height="630" fill="${BG}"/>
      ${gridPattern(0.03)}
      ${noiseTexture()}

      <!-- Ambient glow -->
      <circle cx="900" cy="280" r="260" fill="${ORANGE}" opacity="0.04"/>

      <!-- Layout grid decoration -->
      <g transform="translate(720, 140)" opacity="0.1">
        <rect x="0" y="0" width="380" height="280" rx="8" fill="none" stroke="${ORANGE}" stroke-width="2"/>
        <rect x="0" y="0" width="380" height="32" rx="8" fill="${ORANGE}" opacity="0.15"/>
        <circle cx="20" cy="16" r="5" fill="${ORANGE}" opacity="0.5"/>
        <circle cx="40" cy="16" r="5" fill="${YELLOW}" opacity="0.5"/>
        <circle cx="60" cy="16" r="5" fill="${MINT}" opacity="0.5"/>
        <rect x="16" y="48" width="348" height="24" rx="3" fill="${TEXT_MUTED}" opacity="0.3"/>
        <rect x="16" y="84" width="160" height="80" rx="3" fill="${ORANGE}" opacity="0.2"/>
        <rect x="192" y="84" width="172" height="80" rx="3" fill="${ORANGE}" opacity="0.15"/>
        <rect x="16" y="180" width="348" height="16" rx="3" fill="${TEXT_MUTED}" opacity="0.2"/>
        <rect x="16" y="208" width="280" height="16" rx="3" fill="${TEXT_MUTED}" opacity="0.15"/>
        <rect x="16" y="236" width="120" height="28" rx="4" fill="${ORANGE}" opacity="0.25"/>
      </g>

      <!-- Title -->
      <text x="88" y="260" font-family="'Trebuchet MS', 'Arial Black', sans-serif" font-size="72" font-weight="900" fill="${TEXT}" letter-spacing="1">Web Design</text>
      <text x="88" y="340" font-family="'Trebuchet MS', 'Arial Black', sans-serif" font-size="72" font-weight="900" fill="${ORANGE}" letter-spacing="1">in Boulder</text>

      <!-- Location -->
      <g transform="translate(92, 390)">
        <text font-family="'Segoe UI', Arial, sans-serif" font-size="22" fill="${TEXT_MUTED}" letter-spacing="2">BOULDER, CO  &#xB7;  CUSTOM WEBSITES</text>
      </g>

      ${siteBadge()}
      ${bottomBar(ORANGE)}
    </svg>`,
  },
  {
    name: 'services-lakewood',
    svg: () => `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
      <rect width="1200" height="630" fill="${BG}"/>
      ${gridPattern(0.03)}
      ${noiseTexture()}

      <!-- Ambient glow -->
      <circle cx="900" cy="280" r="260" fill="${ORANGE}" opacity="0.04"/>

      <!-- Layout grid decoration -->
      <g transform="translate(720, 140)" opacity="0.1">
        <rect x="0" y="0" width="380" height="280" rx="8" fill="none" stroke="${ORANGE}" stroke-width="2"/>
        <rect x="0" y="0" width="380" height="32" rx="8" fill="${ORANGE}" opacity="0.15"/>
        <circle cx="20" cy="16" r="5" fill="${ORANGE}" opacity="0.5"/>
        <circle cx="40" cy="16" r="5" fill="${YELLOW}" opacity="0.5"/>
        <circle cx="60" cy="16" r="5" fill="${MINT}" opacity="0.5"/>
        <rect x="16" y="48" width="348" height="24" rx="3" fill="${TEXT_MUTED}" opacity="0.3"/>
        <rect x="16" y="84" width="160" height="80" rx="3" fill="${ORANGE}" opacity="0.2"/>
        <rect x="192" y="84" width="172" height="80" rx="3" fill="${ORANGE}" opacity="0.15"/>
        <rect x="16" y="180" width="348" height="16" rx="3" fill="${TEXT_MUTED}" opacity="0.2"/>
        <rect x="16" y="208" width="280" height="16" rx="3" fill="${TEXT_MUTED}" opacity="0.15"/>
        <rect x="16" y="236" width="120" height="28" rx="4" fill="${ORANGE}" opacity="0.25"/>
      </g>

      <!-- Title -->
      <text x="88" y="260" font-family="'Trebuchet MS', 'Arial Black', sans-serif" font-size="72" font-weight="900" fill="${TEXT}" letter-spacing="1">Web Design</text>
      <text x="88" y="340" font-family="'Trebuchet MS', 'Arial Black', sans-serif" font-size="72" font-weight="900" fill="${ORANGE}" letter-spacing="1">in Lakewood</text>

      <!-- Location -->
      <g transform="translate(92, 390)">
        <text font-family="'Segoe UI', Arial, sans-serif" font-size="22" fill="${TEXT_MUTED}" letter-spacing="2">LAKEWOOD, CO  &#xB7;  CUSTOM WEBSITES</text>
      </g>

      ${siteBadge()}
      ${bottomBar(ORANGE)}
    </svg>`,
  },
  {
    name: 'services-arvada',
    svg: () => `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
      <rect width="1200" height="630" fill="${BG}"/>
      ${gridPattern(0.03)}
      ${noiseTexture()}

      <!-- Ambient glow -->
      <circle cx="900" cy="280" r="260" fill="${ORANGE}" opacity="0.04"/>

      <!-- Layout grid decoration -->
      <g transform="translate(720, 140)" opacity="0.1">
        <rect x="0" y="0" width="380" height="280" rx="8" fill="none" stroke="${ORANGE}" stroke-width="2"/>
        <rect x="0" y="0" width="380" height="32" rx="8" fill="${ORANGE}" opacity="0.15"/>
        <circle cx="20" cy="16" r="5" fill="${ORANGE}" opacity="0.5"/>
        <circle cx="40" cy="16" r="5" fill="${YELLOW}" opacity="0.5"/>
        <circle cx="60" cy="16" r="5" fill="${MINT}" opacity="0.5"/>
        <rect x="16" y="48" width="348" height="24" rx="3" fill="${TEXT_MUTED}" opacity="0.3"/>
        <rect x="16" y="84" width="160" height="80" rx="3" fill="${ORANGE}" opacity="0.2"/>
        <rect x="192" y="84" width="172" height="80" rx="3" fill="${ORANGE}" opacity="0.15"/>
        <rect x="16" y="180" width="348" height="16" rx="3" fill="${TEXT_MUTED}" opacity="0.2"/>
        <rect x="16" y="208" width="280" height="16" rx="3" fill="${TEXT_MUTED}" opacity="0.15"/>
        <rect x="16" y="236" width="120" height="28" rx="4" fill="${ORANGE}" opacity="0.25"/>
      </g>

      <!-- Title -->
      <text x="88" y="260" font-family="'Trebuchet MS', 'Arial Black', sans-serif" font-size="72" font-weight="900" fill="${TEXT}" letter-spacing="1">Web Design</text>
      <text x="88" y="340" font-family="'Trebuchet MS', 'Arial Black', sans-serif" font-size="72" font-weight="900" fill="${ORANGE}" letter-spacing="1">in Arvada</text>

      <!-- Location -->
      <g transform="translate(92, 390)">
        <text font-family="'Segoe UI', Arial, sans-serif" font-size="22" fill="${TEXT_MUTED}" letter-spacing="2">ARVADA, CO  &#xB7;  CUSTOM WEBSITES</text>
      </g>

      ${siteBadge()}
      ${bottomBar(ORANGE)}
    </svg>`,
  },
  {
    name: 'services-golden',
    svg: () => `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
      <rect width="1200" height="630" fill="${BG}"/>
      ${gridPattern(0.03)}
      ${noiseTexture()}

      <!-- Ambient glow -->
      <circle cx="900" cy="280" r="260" fill="${ORANGE}" opacity="0.04"/>

      <!-- Layout grid decoration -->
      <g transform="translate(720, 140)" opacity="0.1">
        <rect x="0" y="0" width="380" height="280" rx="8" fill="none" stroke="${ORANGE}" stroke-width="2"/>
        <rect x="0" y="0" width="380" height="32" rx="8" fill="${ORANGE}" opacity="0.15"/>
        <circle cx="20" cy="16" r="5" fill="${ORANGE}" opacity="0.5"/>
        <circle cx="40" cy="16" r="5" fill="${YELLOW}" opacity="0.5"/>
        <circle cx="60" cy="16" r="5" fill="${MINT}" opacity="0.5"/>
        <rect x="16" y="48" width="348" height="24" rx="3" fill="${TEXT_MUTED}" opacity="0.3"/>
        <rect x="16" y="84" width="160" height="80" rx="3" fill="${ORANGE}" opacity="0.2"/>
        <rect x="192" y="84" width="172" height="80" rx="3" fill="${ORANGE}" opacity="0.15"/>
        <rect x="16" y="180" width="348" height="16" rx="3" fill="${TEXT_MUTED}" opacity="0.2"/>
        <rect x="16" y="208" width="280" height="16" rx="3" fill="${TEXT_MUTED}" opacity="0.15"/>
        <rect x="16" y="236" width="120" height="28" rx="4" fill="${ORANGE}" opacity="0.25"/>
      </g>

      <!-- Title -->
      <text x="88" y="260" font-family="'Trebuchet MS', 'Arial Black', sans-serif" font-size="72" font-weight="900" fill="${TEXT}" letter-spacing="1">Web Design</text>
      <text x="88" y="340" font-family="'Trebuchet MS', 'Arial Black', sans-serif" font-size="72" font-weight="900" fill="${ORANGE}" letter-spacing="1">in Golden</text>

      <!-- Location -->
      <g transform="translate(92, 390)">
        <text font-family="'Segoe UI', Arial, sans-serif" font-size="22" fill="${TEXT_MUTED}" letter-spacing="2">GOLDEN, CO  &#xB7;  CUSTOM WEBSITES</text>
      </g>

      ${siteBadge()}
      ${bottomBar(ORANGE)}
    </svg>`,
  },
  {
    name: 'services-littleton',
    svg: () => `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
      <rect width="1200" height="630" fill="${BG}"/>
      ${gridPattern(0.03)}
      ${noiseTexture()}

      <!-- Ambient glow -->
      <circle cx="900" cy="280" r="260" fill="${ORANGE}" opacity="0.04"/>

      <!-- Layout grid decoration -->
      <g transform="translate(720, 140)" opacity="0.1">
        <rect x="0" y="0" width="380" height="280" rx="8" fill="none" stroke="${ORANGE}" stroke-width="2"/>
        <rect x="0" y="0" width="380" height="32" rx="8" fill="${ORANGE}" opacity="0.15"/>
        <circle cx="20" cy="16" r="5" fill="${ORANGE}" opacity="0.5"/>
        <circle cx="40" cy="16" r="5" fill="${YELLOW}" opacity="0.5"/>
        <circle cx="60" cy="16" r="5" fill="${MINT}" opacity="0.5"/>
        <rect x="16" y="48" width="348" height="24" rx="3" fill="${TEXT_MUTED}" opacity="0.3"/>
        <rect x="16" y="84" width="160" height="80" rx="3" fill="${ORANGE}" opacity="0.2"/>
        <rect x="192" y="84" width="172" height="80" rx="3" fill="${ORANGE}" opacity="0.15"/>
        <rect x="16" y="180" width="348" height="16" rx="3" fill="${TEXT_MUTED}" opacity="0.2"/>
        <rect x="16" y="208" width="280" height="16" rx="3" fill="${TEXT_MUTED}" opacity="0.15"/>
        <rect x="16" y="236" width="120" height="28" rx="4" fill="${ORANGE}" opacity="0.25"/>
      </g>

      <!-- Title -->
      <text x="88" y="260" font-family="'Trebuchet MS', 'Arial Black', sans-serif" font-size="72" font-weight="900" fill="${TEXT}" letter-spacing="1">Web Design</text>
      <text x="88" y="340" font-family="'Trebuchet MS', 'Arial Black', sans-serif" font-size="72" font-weight="900" fill="${ORANGE}" letter-spacing="1">in Littleton</text>

      <!-- Location -->
      <g transform="translate(92, 390)">
        <text font-family="'Segoe UI', Arial, sans-serif" font-size="22" fill="${TEXT_MUTED}" letter-spacing="2">LITTLETON, CO  &#xB7;  CUSTOM WEBSITES</text>
      </g>

      ${siteBadge()}
      ${bottomBar(ORANGE)}
    </svg>`,
  },
  {
    name: 'projects',
    svg: () => `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
      <rect width="1200" height="630" fill="${BG}"/>
      ${gridPattern(0.03)}
      ${noiseTexture()}

      <!-- Ambient glow -->
      <circle cx="880" cy="300" r="240" fill="${ORANGE}" opacity="0.04"/>
      <circle cx="950" cy="250" r="150" fill="${MAGENTA}" opacity="0.025"/>

      <!-- App window stack decoration -->
      <g transform="translate(700, 120)" opacity="0.12">
        <!-- Back window -->
        <rect x="40" y="40" width="320" height="220" rx="8" fill="none" stroke="${TEXT_DIM}" stroke-width="1.5"/>
        <!-- Middle window -->
        <rect x="20" y="20" width="320" height="220" rx="8" fill="${BG_SURFACE}" stroke="${ORANGE}" stroke-width="1.5" opacity="0.8"/>
        <!-- Front window -->
        <rect x="0" y="0" width="320" height="220" rx="8" fill="${BG_ELEVATED}" stroke="${ORANGE}" stroke-width="2"/>
        <rect x="0" y="0" width="320" height="28" rx="8" fill="${ORANGE}" opacity="0.2"/>
        <circle cx="16" cy="14" r="4" fill="${ORANGE}" opacity="0.6"/>
        <circle cx="32" cy="14" r="4" fill="${YELLOW}" opacity="0.6"/>
        <circle cx="48" cy="14" r="4" fill="${MINT}" opacity="0.6"/>
        <!-- Code lines -->
        <rect x="16" y="44" width="100" height="3" rx="1" fill="${ORANGE}" opacity="0.4"/>
        <rect x="16" y="56" width="180" height="3" rx="1" fill="${TEXT_MUTED}" opacity="0.3"/>
        <rect x="32" y="68" width="140" height="3" rx="1" fill="${MINT}" opacity="0.3"/>
        <rect x="32" y="80" width="200" height="3" rx="1" fill="${TEXT_MUTED}" opacity="0.2"/>
        <rect x="16" y="92" width="160" height="3" rx="1" fill="${PURPLE}" opacity="0.3"/>
        <rect x="16" y="114" width="80" height="24" rx="4" fill="${ORANGE}" opacity="0.2"/>
        <rect x="110" y="114" width="80" height="24" rx="4" fill="${MINT}" opacity="0.15"/>
      </g>

      <!-- Title -->
      <text x="88" y="280" font-family="'Trebuchet MS', 'Arial Black', sans-serif" font-size="80" font-weight="900" fill="${TEXT}" letter-spacing="1">Projects</text>

      <!-- Subtitle -->
      <text x="92" y="340" font-family="'Segoe UI', Arial, sans-serif" font-size="26" fill="${TEXT_MUTED}" letter-spacing="1">Web apps built with React, TypeScript &amp; Astro</text>

      <!-- Project name pills -->
      <g transform="translate(88, 380)">
        <rect x="0" y="0" width="110" height="30" rx="4" fill="${BG_ELEVATED}" stroke="${ORANGE}" stroke-width="1" opacity="0.6"/>
        <text x="55" y="20" font-family="'Courier New', monospace" font-size="13" fill="${ORANGE}" text-anchor="middle">CreatiCalc</text>
        <rect x="124" y="0" width="120" height="30" rx="4" fill="${BG_ELEVATED}" stroke="${MAGENTA}" stroke-width="1" opacity="0.6"/>
        <text x="184" y="20" font-family="'Courier New', monospace" font-size="13" fill="${MAGENTA}" text-anchor="middle">RetroRetro</text>
        <rect x="258" y="0" width="100" height="30" rx="4" fill="${BG_ELEVATED}" stroke="${MINT}" stroke-width="1" opacity="0.6"/>
        <text x="308" y="20" font-family="'Courier New', monospace" font-size="13" fill="${MINT}" text-anchor="middle">DartForge</text>
        <rect x="372" y="0" width="110" height="30" rx="4" fill="${BG_ELEVATED}" stroke="${YELLOW}" stroke-width="1" opacity="0.6"/>
        <text x="427" y="20" font-family="'Courier New', monospace" font-size="13" fill="${YELLOW}" text-anchor="middle">Critter Care</text>
      </g>

      ${siteBadge()}
      ${bottomBar(ORANGE)}
    </svg>`,
  },
  {
    name: 'arcade',
    svg: () => `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
      <rect width="1200" height="630" fill="${BG}"/>
      ${gridPattern(0.03)}
      ${noiseTexture()}

      <!-- Ambient glow -->
      <circle cx="880" cy="300" r="260" fill="${MAGENTA}" opacity="0.05"/>

      <!-- Pixel art joystick -->
      <g transform="translate(760, 130)" opacity="0.15">
        <!-- Base -->
        <rect x="20" y="240" width="200" height="40" rx="6" fill="${MAGENTA}"/>
        <rect x="40" y="220" width="160" height="30" rx="4" fill="${MAGENTA}" opacity="0.8"/>
        <!-- Stick -->
        <rect x="100" y="80" width="40" height="150" rx="4" fill="${TEXT_MUTED}"/>
        <!-- Ball top -->
        <circle cx="120" cy="70" r="36" fill="${MAGENTA}"/>
        <circle cx="112" cy="58" r="12" fill="white" opacity="0.15"/>
        <!-- Buttons -->
        <circle cx="300" cy="200" r="24" fill="${MINT}" opacity="0.7"/>
        <circle cx="360" cy="180" r="24" fill="${ORANGE}" opacity="0.7"/>
        <circle cx="340" cy="240" r="18" fill="${YELLOW}" opacity="0.5"/>
      </g>

      <!-- Scanline effect -->
      <g opacity="0.02">
        ${Array.from({ length: 32 }, (_, i) => `<rect x="0" y="${i * 20}" width="1200" height="1" fill="white"/>`).join('')}
      </g>

      <!-- Title -->
      <text x="88" y="280" font-family="'Trebuchet MS', 'Arial Black', sans-serif" font-size="88" font-weight="900" fill="${MAGENTA}" letter-spacing="2">Arcade</text>

      <!-- Subtitle -->
      <text x="92" y="340" font-family="'Segoe UI', Arial, sans-serif" font-size="26" fill="${TEXT_MUTED}" letter-spacing="1">Browser games by Bill Bergquist</text>

      <!-- Game pills -->
      <g transform="translate(88, 380)">
        <rect x="0" y="0" width="90" height="30" rx="4" fill="${BG_ELEVATED}" stroke="${MAGENTA}" stroke-width="1" opacity="0.6"/>
        <text x="45" y="20" font-family="'Courier New', monospace" font-size="13" fill="${MAGENTA}" text-anchor="middle">Descent</text>
        <rect x="104" y="0" width="90" height="30" rx="4" fill="${BG_ELEVATED}" stroke="${BLUE}" stroke-width="1" opacity="0.6"/>
        <text x="149" y="20" font-family="'Courier New', monospace" font-size="13" fill="${BLUE}" text-anchor="middle">Gridlock</text>
        <rect x="208" y="0" width="80" height="30" rx="4" fill="${BG_ELEVATED}" stroke="${YELLOW}" stroke-width="1" opacity="0.6"/>
        <text x="248" y="20" font-family="'Courier New', monospace" font-size="13" fill="${YELLOW}" text-anchor="middle">Craps</text>
      </g>

      ${siteBadge()}
      ${bottomBar(MAGENTA)}
    </svg>`,
  },
  {
    name: 'descent',
    svg: () => `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
      <rect width="1200" height="630" fill="${BG}"/>
      ${gridPattern(0.025)}
      ${noiseTexture()}

      <!-- Ambient glow -->
      <circle cx="900" cy="300" r="250" fill="${MAGENTA}" opacity="0.05"/>

      <!-- Minesweeper grid -->
      <g transform="translate(700, 100)" opacity="0.15">
        ${Array.from({ length: 6 }, (_, r) =>
          Array.from({ length: 8 }, (_, c) => {
            const x = c * 44;
            const y = r * 44;
            const revealed = Math.random() > 0.4;
            const isMine = revealed && Math.random() > 0.7;
            const num = !isMine && revealed ? Math.floor(Math.random() * 3) + 1 : 0;
            const colors = ['', MINT, BLUE, ORANGE];
            return `
              <rect x="${x}" y="${y}" width="40" height="40" rx="3"
                fill="${revealed ? BG_SURFACE : BG_ELEVATED}"
                stroke="${revealed ? TEXT_DIM : MAGENTA}" stroke-width="1" opacity="${revealed ? 0.6 : 1}"/>
              ${isMine ? `<circle cx="${x + 20}" cy="${y + 20}" r="10" fill="${MAGENTA}" opacity="0.7"/>` : ''}
              ${num > 0 ? `<text x="${x + 20}" y="${y + 26}" font-family="'Arial Black', sans-serif" font-size="18" fill="${colors[num]}" text-anchor="middle" opacity="0.6">${num}</text>` : ''}`;
          }).join('')
        ).join('')}
      </g>

      <!-- Title -->
      <text x="88" y="250" font-family="'Trebuchet MS', 'Arial Black', sans-serif" font-size="72" font-weight="900" fill="${TEXT}" letter-spacing="1">Minesweeper:</text>
      <text x="88" y="340" font-family="'Trebuchet MS', 'Arial Black', sans-serif" font-size="80" font-weight="900" fill="${MAGENTA}" letter-spacing="2">Descent</text>

      <!-- Subtitle -->
      <text x="92" y="396" font-family="'Segoe UI', Arial, sans-serif" font-size="24" fill="${TEXT_MUTED}" letter-spacing="1">A roguelike twist on classic minesweeper</text>

      <!-- Stats -->
      <g transform="translate(92, 430)">
        <text font-family="'Courier New', monospace" font-size="16" fill="${MAGENTA}" opacity="0.7">10 floors</text>
        <text x="110" font-family="'Courier New', monospace" font-size="16" fill="${TEXT_DIM}">&#xB7;</text>
        <text x="130" font-family="'Courier New', monospace" font-size="16" fill="${ORANGE}" opacity="0.7">power-ups</text>
        <text x="240" font-family="'Courier New', monospace" font-size="16" fill="${TEXT_DIM}">&#xB7;</text>
        <text x="260" font-family="'Courier New', monospace" font-size="16" fill="${MINT}" opacity="0.7">permadeath</text>
      </g>

      ${siteBadge()}
      ${bottomBar(MAGENTA)}
    </svg>`,
  },
  {
    name: 'retro',
    svg: () => `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
      <rect width="1200" height="630" fill="${BG}"/>
      ${gridPattern(0.03)}
      ${noiseTexture()}

      <!-- Ambient glow -->
      <circle cx="900" cy="280" r="260" fill="${PURPLE}" opacity="0.05"/>

      <!-- Sticky notes decoration -->
      <g transform="translate(680, 100)">
        <!-- Column headers -->
        <text x="60" y="20" font-family="'Segoe UI', Arial, sans-serif" font-size="14" fill="${TEXT_DIM}" text-anchor="middle" letter-spacing="2">WENT WELL</text>
        <text x="210" y="20" font-family="'Segoe UI', Arial, sans-serif" font-size="14" fill="${TEXT_DIM}" text-anchor="middle" letter-spacing="2">IMPROVE</text>
        <text x="360" y="20" font-family="'Segoe UI', Arial, sans-serif" font-size="14" fill="${TEXT_DIM}" text-anchor="middle" letter-spacing="2">ACTIONS</text>

        <!-- Divider lines -->
        <rect x="135" y="0" width="1" height="340" fill="${TEXT_DIM}" opacity="0.2"/>
        <rect x="285" y="0" width="1" height="340" fill="${TEXT_DIM}" opacity="0.2"/>

        <!-- Green sticky notes -->
        <rect x="10" y="40" width="100" height="80" rx="4" fill="${MINT}" opacity="0.15" transform="rotate(-2, 60, 80)"/>
        <rect x="10" y="135" width="100" height="60" rx="4" fill="${MINT}" opacity="0.12" transform="rotate(1, 60, 165)"/>
        <rect x="10" y="210" width="100" height="70" rx="4" fill="${MINT}" opacity="0.1" transform="rotate(-1, 60, 245)"/>

        <!-- Orange sticky notes -->
        <rect x="155" y="40" width="100" height="70" rx="4" fill="${ORANGE}" opacity="0.15" transform="rotate(1, 205, 75)"/>
        <rect x="155" y="125" width="100" height="90" rx="4" fill="${ORANGE}" opacity="0.12" transform="rotate(-2, 205, 170)"/>

        <!-- Purple sticky notes -->
        <rect x="305" y="40" width="100" height="60" rx="4" fill="${PURPLE}" opacity="0.15" transform="rotate(-1, 355, 70)"/>
        <rect x="305" y="115" width="100" height="80" rx="4" fill="${PURPLE}" opacity="0.12" transform="rotate(2, 355, 155)"/>
        <rect x="305" y="210" width="100" height="65" rx="4" fill="${PURPLE}" opacity="0.1" transform="rotate(-1, 355, 242)"/>

        <!-- Vote dots -->
        <circle cx="100" cy="110" r="8" fill="${MINT}" opacity="0.25"/>
        <text x="100" y="114" font-family="'Segoe UI', sans-serif" font-size="10" fill="${TEXT}" text-anchor="middle">3</text>
        <circle cx="245" cy="100" r="8" fill="${ORANGE}" opacity="0.25"/>
        <text x="245" y="104" font-family="'Segoe UI', sans-serif" font-size="10" fill="${TEXT}" text-anchor="middle">5</text>
      </g>

      <!-- Title -->
      <text x="88" y="280" font-family="'Trebuchet MS', 'Arial Black', sans-serif" font-size="80" font-weight="900" fill="${PURPLE}" letter-spacing="1">RetroRetro</text>

      <!-- Subtitle -->
      <text x="92" y="340" font-family="'Segoe UI', Arial, sans-serif" font-size="26" fill="${TEXT_MUTED}" letter-spacing="1">Real-time retrospective boards</text>

      <!-- Features -->
      <g transform="translate(92, 384)">
        <text font-family="'Courier New', monospace" font-size="16" fill="${PURPLE}" opacity="0.7">sticky notes</text>
        <text x="130" font-family="'Courier New', monospace" font-size="16" fill="${TEXT_DIM}">&#xB7;</text>
        <text x="150" font-family="'Courier New', monospace" font-size="16" fill="${MINT}" opacity="0.7">voting</text>
        <text x="220" font-family="'Courier New', monospace" font-size="16" fill="${TEXT_DIM}">&#xB7;</text>
        <text x="240" font-family="'Courier New', monospace" font-size="16" fill="${ORANGE}" opacity="0.7">real-time sync</text>
      </g>

      ${siteBadge()}
      ${bottomBar(PURPLE)}
    </svg>`,
  },
  {
    name: 'craps',
    svg: () => `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
      <rect width="1200" height="630" fill="${BG}"/>
      ${gridPattern(0.025)}
      ${noiseTexture()}

      <!-- Ambient glow -->
      <circle cx="880" cy="280" r="260" fill="${YELLOW}" opacity="0.04"/>

      <!-- Dice decoration -->
      <g transform="translate(720, 110)">
        <!-- Die 1 (tilted) -->
        <g transform="rotate(-12, 120, 120)">
          <rect x="40" y="40" width="160" height="160" rx="20" fill="${BG_ELEVATED}" stroke="${YELLOW}" stroke-width="2.5" opacity="0.25"/>
          <!-- Pips for 5 -->
          <circle cx="80" cy="80" r="12" fill="${YELLOW}" opacity="0.5"/>
          <circle cx="160" cy="80" r="12" fill="${YELLOW}" opacity="0.5"/>
          <circle cx="120" cy="120" r="12" fill="${YELLOW}" opacity="0.5"/>
          <circle cx="80" cy="160" r="12" fill="${YELLOW}" opacity="0.5"/>
          <circle cx="160" cy="160" r="12" fill="${YELLOW}" opacity="0.5"/>
        </g>

        <!-- Die 2 (tilted other way) -->
        <g transform="rotate(8, 320, 140)">
          <rect x="240" y="60" width="160" height="160" rx="20" fill="${BG_ELEVATED}" stroke="${ORANGE}" stroke-width="2.5" opacity="0.25"/>
          <!-- Pips for 2 -->
          <circle cx="290" cy="110" r="12" fill="${ORANGE}" opacity="0.5"/>
          <circle cx="370" cy="190" r="12" fill="${ORANGE}" opacity="0.5"/>
        </g>
      </g>

      <!-- Title -->
      <text x="88" y="280" font-family="'Trebuchet MS', 'Arial Black', sans-serif" font-size="88" font-weight="900" fill="${YELLOW}" letter-spacing="2">Craps</text>

      <!-- Subtitle -->
      <text x="92" y="340" font-family="'Segoe UI', Arial, sans-serif" font-size="26" fill="${TEXT_MUTED}" letter-spacing="1">Multiplayer dice game</text>

      <!-- Features -->
      <g transform="translate(92, 384)">
        <text font-family="'Courier New', monospace" font-size="16" fill="${YELLOW}" opacity="0.7">real-time</text>
        <text x="100" font-family="'Courier New', monospace" font-size="16" fill="${TEXT_DIM}">&#xB7;</text>
        <text x="120" font-family="'Courier New', monospace" font-size="16" fill="${ORANGE}" opacity="0.7">up to 4 players</text>
        <text x="290" font-family="'Courier New', monospace" font-size="16" fill="${TEXT_DIM}">&#xB7;</text>
        <text x="310" font-family="'Courier New', monospace" font-size="16" fill="${MINT}" opacity="0.7">WebSocket rooms</text>
      </g>

      ${siteBadge()}
      ${bottomBar(YELLOW)}
    </svg>`,
  },
  {
    name: 'gridlock',
    svg: () => `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
      <rect width="1200" height="630" fill="${BG}"/>
      ${gridPattern(0.025)}
      ${noiseTexture()}

      <!-- Ambient glow -->
      <circle cx="900" cy="300" r="260" fill="${BLUE}" opacity="0.04"/>

      <!-- Tetromino blocks decoration -->
      <g transform="translate(720, 80)" opacity="0.18">
        <!-- T-piece -->
        <g fill="${PURPLE}">
          <rect x="40" y="0" width="36" height="36" rx="4"/>
          <rect x="0" y="40" width="36" height="36" rx="4"/>
          <rect x="40" y="40" width="36" height="36" rx="4"/>
          <rect x="80" y="40" width="36" height="36" rx="4"/>
        </g>
        <!-- L-piece -->
        <g fill="${ORANGE}">
          <rect x="180" y="0" width="36" height="36" rx="4"/>
          <rect x="180" y="40" width="36" height="36" rx="4"/>
          <rect x="180" y="80" width="36" height="36" rx="4"/>
          <rect x="220" y="80" width="36" height="36" rx="4"/>
        </g>
        <!-- S-piece -->
        <g fill="${MINT}">
          <rect x="320" y="40" width="36" height="36" rx="4"/>
          <rect x="360" y="40" width="36" height="36" rx="4"/>
          <rect x="280" y="80" width="36" height="36" rx="4"/>
          <rect x="320" y="80" width="36" height="36" rx="4"/>
        </g>
        <!-- I-piece -->
        <g fill="${BLUE}">
          <rect x="60" y="160" width="36" height="36" rx="4"/>
          <rect x="100" y="160" width="36" height="36" rx="4"/>
          <rect x="140" y="160" width="36" height="36" rx="4"/>
          <rect x="180" y="160" width="36" height="36" rx="4"/>
        </g>
        <!-- O-piece -->
        <g fill="${YELLOW}">
          <rect x="300" y="160" width="36" height="36" rx="4"/>
          <rect x="340" y="160" width="36" height="36" rx="4"/>
          <rect x="300" y="200" width="36" height="36" rx="4"/>
          <rect x="340" y="200" width="36" height="36" rx="4"/>
        </g>
        <!-- Landed blocks at bottom -->
        <g opacity="0.5">
          <rect x="0" y="280" width="36" height="36" rx="4" fill="${BLUE}"/>
          <rect x="40" y="280" width="36" height="36" rx="4" fill="${BLUE}"/>
          <rect x="80" y="280" width="36" height="36" rx="4" fill="${PURPLE}"/>
          <rect x="120" y="280" width="36" height="36" rx="4" fill="${ORANGE}"/>
          <rect x="160" y="280" width="36" height="36" rx="4" fill="${ORANGE}"/>
          <rect x="240" y="280" width="36" height="36" rx="4" fill="${MINT}"/>
          <rect x="280" y="280" width="36" height="36" rx="4" fill="${MINT}"/>
          <rect x="320" y="280" width="36" height="36" rx="4" fill="${YELLOW}"/>
          <rect x="360" y="280" width="36" height="36" rx="4" fill="${YELLOW}"/>
          <rect x="80" y="240" width="36" height="36" rx="4" fill="${PURPLE}"/>
          <rect x="120" y="240" width="36" height="36" rx="4" fill="${PURPLE}"/>
          <rect x="280" y="240" width="36" height="36" rx="4" fill="${ORANGE}"/>
        </g>
      </g>

      <!-- Title -->
      <text x="88" y="260" font-family="'Trebuchet MS', 'Arial Black', sans-serif" font-size="72" font-weight="900" fill="${TEXT}" letter-spacing="1">Gridlock:</text>
      <text x="88" y="350" font-family="'Trebuchet MS', 'Arial Black', sans-serif" font-size="80" font-weight="900" fill="${BLUE}" letter-spacing="2">Showdown</text>

      <!-- Subtitle -->
      <text x="92" y="406" font-family="'Segoe UI', Arial, sans-serif" font-size="24" fill="${TEXT_MUTED}" letter-spacing="1">Falling-blocks puzzle with global leaderboard</text>

      ${siteBadge()}
      ${bottomBar(BLUE)}
    </svg>`,
  },
  {
    name: 'blog',
    svg: () => `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
      <rect width="1200" height="630" fill="${BG}"/>
      ${gridPattern(0.03)}
      ${noiseTexture()}

      <!-- Ambient glow -->
      <circle cx="880" cy="300" r="240" fill="${MINT}" opacity="0.04"/>

      <!-- Article lines decoration -->
      <g transform="translate(720, 120)" opacity="0.1">
        <!-- Article card 1 -->
        <rect x="0" y="0" width="360" height="120" rx="6" fill="${BG_ELEVATED}" stroke="${TEXT_DIM}" stroke-width="1"/>
        <rect x="16" y="16" width="200" height="8" rx="2" fill="${MINT}" opacity="0.6"/>
        <rect x="16" y="36" width="320" height="4" rx="1" fill="${TEXT_MUTED}" opacity="0.4"/>
        <rect x="16" y="50" width="280" height="4" rx="1" fill="${TEXT_MUTED}" opacity="0.3"/>
        <rect x="16" y="64" width="300" height="4" rx="1" fill="${TEXT_MUTED}" opacity="0.25"/>
        <rect x="16" y="90" width="60" height="16" rx="3" fill="${MINT}" opacity="0.2"/>
        <rect x="86" y="90" width="50" height="16" rx="3" fill="${PURPLE}" opacity="0.2"/>

        <!-- Article card 2 -->
        <rect x="0" y="140" width="360" height="120" rx="6" fill="${BG_ELEVATED}" stroke="${TEXT_DIM}" stroke-width="1" opacity="0.7"/>
        <rect x="16" y="156" width="240" height="8" rx="2" fill="${ORANGE}" opacity="0.5"/>
        <rect x="16" y="176" width="300" height="4" rx="1" fill="${TEXT_MUTED}" opacity="0.3"/>
        <rect x="16" y="190" width="260" height="4" rx="1" fill="${TEXT_MUTED}" opacity="0.25"/>
        <rect x="16" y="204" width="280" height="4" rx="1" fill="${TEXT_MUTED}" opacity="0.2"/>
        <rect x="16" y="230" width="70" height="16" rx="3" fill="${ORANGE}" opacity="0.15"/>
      </g>

      <!-- Title -->
      <text x="88" y="280" font-family="'Trebuchet MS', 'Arial Black', sans-serif" font-size="80" font-weight="900" fill="${TEXT}" letter-spacing="1">Blog</text>

      <!-- Subtitle -->
      <text x="92" y="340" font-family="'Segoe UI', Arial, sans-serif" font-size="26" fill="${TEXT_MUTED}" letter-spacing="1">Web development, SEO &amp; small business</text>
      <text x="92" y="380" font-family="'Segoe UI', Arial, sans-serif" font-size="22" fill="${TEXT_DIM}" letter-spacing="1">Denver &amp; Colorado Front Range</text>

      ${siteBadge()}
      ${bottomBar(MINT)}
    </svg>`,
  },
];

// ── Generate all images ──
for (const page of pages) {
  const svg = page.svg();
  await sharp(Buffer.from(svg), { density: 150 })
    .resize(1200, 630)
    .png({ quality: 90 })
    .toFile(join(ogDir, `${page.name}.png`));
  console.log(`  Generated og/${page.name}.png`);
}

// Also generate the default og-image.png (same as home)
const homeSvg = pages[0].svg();
await sharp(Buffer.from(homeSvg), { density: 150 })
  .resize(1200, 630)
  .png({ quality: 90 })
  .toFile(join(publicDir, 'og-image.png'));
console.log('  Generated og-image.png (default)');

// ── Blog post OG images ──
// Tag-to-color mapping for visual variety
const TAG_COLORS = {
  'web design': ORANGE,
  'small business': YELLOW,
  denver: MINT,
  seo: PURPLE,
  pricing: BLUE,
  redesign: MAGENTA,
  freelancing: MINT,
  AI: PURPLE,
  scams: ORANGE,
};

function escapeXml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// Simple word-wrap: splits title into lines that fit ~maxChars
function wrapTitle(title, maxChars = 28) {
  const words = title.split(' ');
  const lines = [];
  let current = '';
  for (const word of words) {
    if (current && (current + ' ' + word).length > maxChars) {
      lines.push(current);
      current = word;
    } else {
      current = current ? current + ' ' + word : word;
    }
  }
  if (current) lines.push(current);
  return lines;
}

function parseFrontmatter(content) {
  const normalized = content.replace(/\r\n/g, '\n');
  const match = normalized.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return null;
  const fm = {};
  for (const line of match[1].split('\n')) {
    const kv = line.match(/^(\w+):\s*(.+)$/);
    if (kv) {
      let val = kv[2].trim();
      // Strip surrounding quotes
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      // Parse arrays
      if (val.startsWith('[')) {
        val = val
          .slice(1, -1)
          .split(',')
          .map((s) => s.trim().replace(/^["']|["']$/g, ''));
      }
      fm[kv[1]] = val;
    }
  }
  return fm;
}

// Decorative element per post - cycles through visual motifs
const decorations = [
  // Quotation marks
  (color) => `
    <g transform="translate(780, 120)" opacity="0.08">
      <text font-family="Georgia, serif" font-size="400" fill="${color}">&quot;</text>
    </g>`,
  // Abstract code block
  (color) => `
    <g transform="translate(740, 130)" opacity="0.1">
      <rect x="0" y="0" width="360" height="280" rx="8" fill="${BG_ELEVATED}" stroke="${color}" stroke-width="1.5"/>
      <rect x="0" y="0" width="360" height="28" rx="8" fill="${color}" opacity="0.15"/>
      <circle cx="16" cy="14" r="4" fill="${color}" opacity="0.5"/>
      <circle cx="32" cy="14" r="4" fill="${YELLOW}" opacity="0.5"/>
      <circle cx="48" cy="14" r="4" fill="${MINT}" opacity="0.5"/>
      <rect x="20" y="48" width="140" height="4" rx="1" fill="${color}" opacity="0.3"/>
      <rect x="20" y="64" width="240" height="4" rx="1" fill="${TEXT_MUTED}" opacity="0.25"/>
      <rect x="40" y="80" width="200" height="4" rx="1" fill="${TEXT_MUTED}" opacity="0.2"/>
      <rect x="40" y="96" width="180" height="4" rx="1" fill="${color}" opacity="0.2"/>
      <rect x="20" y="112" width="260" height="4" rx="1" fill="${TEXT_MUTED}" opacity="0.2"/>
      <rect x="20" y="140" width="100" height="4" rx="1" fill="${color}" opacity="0.25"/>
      <rect x="20" y="156" width="280" height="4" rx="1" fill="${TEXT_MUTED}" opacity="0.2"/>
      <rect x="40" y="172" width="160" height="4" rx="1" fill="${TEXT_MUTED}" opacity="0.15"/>
      <rect x="20" y="200" width="200" height="4" rx="1" fill="${color}" opacity="0.2"/>
      <rect x="20" y="216" width="240" height="4" rx="1" fill="${TEXT_MUTED}" opacity="0.15"/>
    </g>`,
  // Chart/graph lines
  (color) => `
    <g transform="translate(760, 140)" opacity="0.1">
      <polyline points="0,220 60,180 120,200 180,120 240,140 300,60 360,80" fill="none" stroke="${color}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
      <polyline points="0,260 60,240 120,250 180,200 240,210 300,160 360,170" fill="none" stroke="${PURPLE}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" opacity="0.5"/>
      <!-- Axis -->
      <line x1="0" y1="280" x2="360" y2="280" stroke="${TEXT_DIM}" stroke-width="1"/>
      <line x1="0" y1="0" x2="0" y2="280" stroke="${TEXT_DIM}" stroke-width="1"/>
      <!-- Data dots -->
      <circle cx="180" cy="120" r="6" fill="${color}" opacity="0.6"/>
      <circle cx="300" cy="60" r="6" fill="${color}" opacity="0.6"/>
    </g>`,
  // Lightbulb / idea
  (color) => `
    <g transform="translate(860, 120)" opacity="0.08">
      <!-- Bulb -->
      <circle cx="80" cy="100" r="80" fill="none" stroke="${color}" stroke-width="4"/>
      <path d="M 50,170 Q 50,200 60,210 L 100,210 Q 110,200 110,170" fill="none" stroke="${color}" stroke-width="3"/>
      <line x1="60" y1="220" x2="100" y2="220" stroke="${color}" stroke-width="3" stroke-linecap="round"/>
      <line x1="65" y1="230" x2="95" y2="230" stroke="${color}" stroke-width="3" stroke-linecap="round"/>
      <!-- Filament -->
      <path d="M 65,130 Q 80,100 80,80 Q 80,100 95,130" fill="none" stroke="${color}" stroke-width="2"/>
      <!-- Rays -->
      <line x1="80" y1="0" x2="80" y2="10" stroke="${color}" stroke-width="2" stroke-linecap="round"/>
      <line x1="160" y1="100" x2="170" y2="100" stroke="${color}" stroke-width="2" stroke-linecap="round"/>
      <line x1="0" y1="100" x2="-10" y2="100" stroke="${color}" stroke-width="2" stroke-linecap="round"/>
      <line x1="137" y1="43" x2="144" y2="36" stroke="${color}" stroke-width="2" stroke-linecap="round"/>
      <line x1="23" y1="43" x2="16" y2="36" stroke="${color}" stroke-width="2" stroke-linecap="round"/>
    </g>`,
];

let blogFiles = [];
try {
  blogFiles = readdirSync(blogContentDir).filter((f) => f.endsWith('.md') || f.endsWith('.mdx'));
} catch (e) {
  console.log(`  Blog content dir not found: ${blogContentDir}`);
}

console.log(`\nBlog post OG images (${blogFiles.length} posts):`);
for (let i = 0; i < blogFiles.length; i++) {
  const file = blogFiles[i];
  const slug = file.replace(/\.mdx?$/, '');
  const content = readFileSync(join(blogContentDir, file), 'utf-8');
  const fm = parseFrontmatter(content);
  if (!fm || !fm.title) continue;

  const title = fm.title;
  const tags = Array.isArray(fm.tags) ? fm.tags.slice(0, 3) : [];
  const date = fm.publishDate || '';

  // Pick accent color from first recognized tag, or cycle through defaults
  const fallbackColors = [ORANGE, MINT, PURPLE, BLUE];
  const accentColor =
    tags.reduce((found, tag) => found || TAG_COLORS[tag], null) || fallbackColors[i % fallbackColors.length];

  // Pick decoration based on index
  const decoration = decorations[i % decorations.length](accentColor);

  // Word-wrap title
  const titleLines = wrapTitle(title, 26);
  const titleFontSize = titleLines.length > 2 ? 44 : 52;
  const titleStartY = titleLines.length > 2 ? 200 : 220;
  const titleLineHeight = titleFontSize * 1.25;

  // Tag pills
  const tagColors = [accentColor, PURPLE, MINT, ORANGE, BLUE];
  let tagX = 0;
  const tagPills = tags
    .map((tag, ti) => {
      const color = tagColors[ti % tagColors.length];
      const charWidth = 8.5;
      const pillWidth = tag.length * charWidth + 24;
      const x = tagX;
      tagX += pillWidth + 12;
      return `
      <rect x="${x}" y="0" width="${pillWidth}" height="28" rx="4" fill="${BG_ELEVATED}" stroke="${color}" stroke-width="1" opacity="0.6"/>
      <text x="${x + pillWidth / 2}" y="19" font-family="'Courier New', monospace" font-size="13" fill="${color}" text-anchor="middle">${escapeXml(tag)}</text>`;
    })
    .join('');

  const formattedDate = date
    ? new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : '';

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
    <rect width="1200" height="630" fill="${BG}"/>
    ${gridPattern(0.025)}
    ${noiseTexture()}

    <!-- Ambient glow -->
    <circle cx="880" cy="280" r="260" fill="${accentColor}" opacity="0.04"/>

    ${decoration}

    <!-- Blog label -->
    <g transform="translate(88, 140)">
      <rect x="0" y="0" width="56" height="24" rx="4" fill="${accentColor}" opacity="0.15"/>
      <text x="28" y="17" font-family="'Segoe UI', Arial, sans-serif" font-size="12" fill="${accentColor}" text-anchor="middle" letter-spacing="1.5" font-weight="600">BLOG</text>
    </g>

    <!-- Title -->
    ${titleLines
      .map(
        (line, li) =>
          `<text x="88" y="${titleStartY + li * titleLineHeight}" font-family="'Trebuchet MS', 'Arial Black', sans-serif" font-size="${titleFontSize}" font-weight="900" fill="${TEXT}" letter-spacing="0.5">${escapeXml(line)}</text>`
      )
      .join('\n    ')}

    <!-- Date -->
    ${formattedDate ? `<text x="92" y="${titleStartY + titleLines.length * titleLineHeight + 20}" font-family="'Segoe UI', Arial, sans-serif" font-size="18" fill="${TEXT_DIM}" letter-spacing="0.5">${escapeXml(formattedDate)}</text>` : ''}

    <!-- Tags -->
    <g transform="translate(88, ${titleStartY + titleLines.length * titleLineHeight + 46})">
      ${tagPills}
    </g>

    <!-- Author -->
    <text x="88" y="570" font-family="'Segoe UI', Arial, sans-serif" font-size="18" fill="${TEXT_MUTED}">Bill Bergquist</text>
    <text x="88" y="592" font-family="'Courier New', monospace" font-size="14" fill="${TEXT_DIM}">billbergquist.dev</text>

    ${bottomBar(accentColor)}
  </svg>`;

  await sharp(Buffer.from(svg), { density: 150 })
    .resize(1200, 630)
    .png({ quality: 90 })
    .toFile(join(blogOgDir, `${slug}.png`));
  console.log(`  Generated og/blog/${slug}.png`);
}

console.log('\nAll OG images generated!');
