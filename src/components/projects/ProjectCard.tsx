import { ReactNode } from 'react';
import Card from '../ui/Card';
import styles from './ProjectCard.module.css';

interface ProjectCardProps {
  title: string;
  description: string;
  techStack: string[];
  url: string;
  color: 'mint' | 'magenta' | 'purple' | 'orange';
  wireframe?: 'dashboard' | 'form' | 'landing';
}

const glowMap = {
  mint: 'glowMint',
  magenta: 'glowMagenta',
  purple: 'glowPurple',
  orange: 'glowOrange',
} as const;

function WireframeDashboard() {
  return (
    <div className={styles.browserContent}>
      <div className={styles.mockLine} style={{ width: '40%' }} />
      <div className={styles.mockRow}>
        <div className={styles.mockBox} />
        <div className={styles.mockBox} />
        <div className={styles.mockBox} />
      </div>
      <div className={styles.mockBlock} />
    </div>
  );
}

function WireframeForm() {
  return (
    <div className={styles.browserContent}>
      <div className={styles.mockLine} style={{ width: '55%' }} />
      <div className={styles.mockInput} />
      <div className={styles.mockInput} />
      <div className={styles.mockButton} />
    </div>
  );
}

function WireframeLanding() {
  return (
    <div className={styles.browserContent}>
      <div className={styles.mockLine} style={{ width: '70%', alignSelf: 'center' }} />
      <div className={styles.mockLine} style={{ width: '45%', alignSelf: 'center' }} />
      <div className={styles.mockRow}>
        <div className={styles.mockCard} />
        <div className={styles.mockCard} />
      </div>
    </div>
  );
}

const wireframeMap: Record<string, () => ReactNode> = {
  dashboard: WireframeDashboard,
  form: WireframeForm,
  landing: WireframeLanding,
};

function ProjectCard({
  title,
  description,
  techStack,
  url,
  color,
  wireframe = 'dashboard',
}: ProjectCardProps) {
  const WireframeComponent = wireframeMap[wireframe] || WireframeDashboard;

  return (
    <Card className={`${styles.projectCard} ${styles[glowMap[color]]}`}>
      <div className={`${styles.browserFrame} ${styles[`frame_${color}`]}`}>
        <div className={styles.browserBar}>
          <span className={styles.browserDot} />
          <span className={styles.browserDot} />
          <span className={styles.browserDot} />
          <span className={styles.browserUrl}>{new URL(url).hostname}</span>
        </div>
        <WireframeComponent />
      </div>
      <h3 className={`${styles.title} neon-text-${color}`}>{title}</h3>
      <p className={styles.description}>{description}</p>
      <div className={styles.techStack}>
        {techStack.map((tech) => (
          <span key={tech} className={styles.techTag}>
            {tech}
          </span>
        ))}
      </div>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className={`${styles.visitLink} ${styles[color]}`}
      >
        Visit Site &rarr;
      </a>
    </Card>
  );
}

export default ProjectCard;
