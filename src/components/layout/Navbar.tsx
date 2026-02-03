import { Link } from 'react-router-dom';
import styles from './Navbar.module.css';

function Navbar() {
  return (
    <header className={styles.navbar}>
      <Link to="/" className={styles.logo}>
        BB
      </Link>
      <nav className={styles.nav}>
        <Link to="/" className={styles.navLink}>
          Home
        </Link>
        <Link to="/about" className={styles.navLink}>
          About
        </Link>
        <Link to="/arcade" className={styles.navLink}>
          Arcade
        </Link>
      </nav>
    </header>
  );
}

export default Navbar;
