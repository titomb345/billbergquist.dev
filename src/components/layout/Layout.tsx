import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';
import ScrollProgress from './ScrollProgress';
import styles from './Layout.module.css';

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [pathname]);

  return null;
}

function Layout() {
  return (
    <div className={styles.layout}>
      <ScrollToTop />
      <ScrollProgress />

      {/* SVG noise texture */}
      <svg className={styles.noise} aria-hidden="true">
        <filter id="noiseFilter">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.9"
            numOctaves="4"
            stitchTiles="stitch"
          />
        </filter>
        <rect width="100%" height="100%" filter="url(#noiseFilter)" />
      </svg>

      {/* Atmospheric gradient orbs */}
      <div className={`${styles.atmosphereOrb} ${styles.orbOrange}`} aria-hidden="true" />
      <div className={`${styles.atmosphereOrb} ${styles.orbMagenta}`} aria-hidden="true" />

      <Navbar />
      <main className={styles.main}>
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}

export default Layout;
