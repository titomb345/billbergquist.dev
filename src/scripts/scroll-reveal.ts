function initScrollReveal() {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const elements = document.querySelectorAll('.scroll-reveal');

  if (prefersReducedMotion) {
    elements.forEach((el) => el.classList.add('scroll-revealed'));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('scroll-revealed');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15, rootMargin: '0px 0px -60px 0px' },
  );

  elements.forEach((el) => observer.observe(el));
}

initScrollReveal();

document.addEventListener('astro:after-swap', initScrollReveal);
