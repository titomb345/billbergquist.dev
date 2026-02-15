import Card from '../ui/Card';
import styles from './ProjectCard.module.css';

interface ProjectCardProps {
  title: string;
  description: string;
  techStack: string[];
  url: string;
  color: 'mint' | 'magenta' | 'purple' | 'orange';
}

function ProjectCard({ title, description, techStack, url, color }: ProjectCardProps) {
  return (
    <Card className={styles.projectCard}>
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
