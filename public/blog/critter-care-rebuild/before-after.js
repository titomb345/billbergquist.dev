/**
 * <before-after> web component — self-contained image comparison slider.
 * Usage: <before-after before="/old.webp" after="/new.webp" alt="Description"></before-after>
 */
class BeforeAfter extends HTMLElement {
  connectedCallback() {
    const before = this.getAttribute('before');
    const after = this.getAttribute('after');
    const alt = this.getAttribute('alt') || 'Before and after comparison';

    const shadow = this.attachShadow({ mode: 'open' });
    shadow.innerHTML = `
      <style>
        :host { display: block; margin: 2rem 0; }
        .container {
          position: relative;
          overflow: hidden;
          border-radius: 8px;
          cursor: col-resize;
          user-select: none;
          -webkit-user-select: none;
          line-height: 0;
          border: 1px solid rgba(255,255,255,0.1);
        }
        .after, .before { position: absolute; inset: 0; }
        .after { position: relative; }
        .after img, .before img {
          display: block;
          width: 100%;
          height: auto;
        }
        .before {
          clip-path: inset(0 50% 0 0);
        }
        .label {
          position: absolute;
          top: 12px;
          padding: 4px 12px;
          background: rgba(0,0,0,0.7);
          color: #fff;
          font-size: 13px;
          font-weight: 600;
          font-family: system-ui, sans-serif;
          border-radius: 4px;
          letter-spacing: 0.02em;
          pointer-events: none;
        }
        .label-before { left: 12px; }
        .label-after { right: 12px; }
        .handle {
          position: absolute;
          top: 0;
          bottom: 0;
          left: 50%;
          width: 3px;
          transform: translateX(-50%);
          background: #fff;
          box-shadow: 0 0 6px rgba(0,0,0,0.4);
          pointer-events: none;
          z-index: 2;
        }
        .knob {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: #fff;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #333;
        }
      </style>
      <div class="container" role="img" aria-label="${alt}">
        <div class="after">
          <img src="${after}" alt="${alt} - After" loading="lazy" />
          <span class="label label-after">After</span>
        </div>
        <div class="before">
          <img src="${before}" alt="${alt} - Before" loading="lazy" />
          <span class="label label-before">Before</span>
        </div>
        <div class="handle">
          <div class="knob" aria-label="Drag to compare">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M6 10L2 6M6 10L2 14M6 10H2M14 10L18 6M14 10L18 14M14 10H18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
        </div>
      </div>
    `;

    const container = shadow.querySelector('.container');
    const beforeEl = shadow.querySelector('.before');
    const handle = shadow.querySelector('.handle');
    let isDragging = false;

    const setPosition = (x) => {
      const rect = container.getBoundingClientRect();
      let pct = ((x - rect.left) / rect.width) * 100;
      pct = Math.max(2, Math.min(98, pct));
      beforeEl.style.clipPath = `inset(0 ${100 - pct}% 0 0)`;
      handle.style.left = pct + '%';
    };

    // Wait for images to load before setting initial position
    const imgs = shadow.querySelectorAll('img');
    let loaded = 0;
    const onLoad = () => {
      loaded++;
      if (loaded >= imgs.length) {
        requestAnimationFrame(() => {
          const rect = container.getBoundingClientRect();
          setPosition(rect.left + rect.width * 0.5);
        });
      }
    };
    imgs.forEach((img) => {
      if (img.complete) onLoad();
      else img.addEventListener('load', onLoad);
    });

    const onMove = (e) => {
      if (!isDragging) return;
      e.preventDefault();
      const x = e.touches ? e.touches[0].clientX : e.clientX;
      setPosition(x);
    };

    container.addEventListener('mousedown', (e) => { isDragging = true; onMove(e); });
    container.addEventListener('touchstart', (e) => { isDragging = true; onMove(e); }, { passive: false });
    window.addEventListener('mousemove', onMove);
    window.addEventListener('touchmove', onMove, { passive: false });
    window.addEventListener('mouseup', () => { isDragging = false; });
    window.addEventListener('touchend', () => { isDragging = false; });
  }
}

if (!customElements.get('before-after')) {
  customElements.define('before-after', BeforeAfter);
}
