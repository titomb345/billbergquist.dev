import styles from './SectionDivider.module.css';

interface SectionDividerProps {
  color?: 'mint' | 'magenta' | 'purple' | 'orange';
}

function SectionDivider({ color = 'mint' }: SectionDividerProps) {
  return (
    <div className={styles.wrapper}>
      <div className={`${styles.line} ${styles[color]}`} />
    </div>
  );
}

export default SectionDivider;
