import { useNavigate } from 'react-router-dom';
import GlowText from '../ui/GlowText';
import Button from '../ui/Button';
import ProjectCard from '../projects/ProjectCard';
import styles from './ProjectsPreview.module.css';

const projects = [
  {
    title: 'CreatiCalc',
    description:
      'Free calculator suite for content creators. Estimate YouTube earnings, engagement rates, and sponsorship pricing.',
    techStack: ['Next.js', 'React', 'TypeScript'],
    url: 'https://creaticalc.com',
    color: 'mint' as const,
  },
  {
    title: 'Sports Shortcuts',
    description:
      'Injury and status alert generator for sports reporters. Create standardized NFL and NBA game-day messages.',
    techStack: ['React', 'TypeScript', 'Material UI'],
    url: 'https://sportsshortcuts.com',
    color: 'magenta' as const,
  },
  {
    title: 'Critter Care',
    description:
      'Pet sitting and dog walking business website. Service listings, testimonials, and CMS-powered content.',
    techStack: ['Astro', 'Tailwind CSS', 'Decap CMS'],
    url: 'https://critter-care.com',
    color: 'purple' as const,
  },
];

function ProjectsPreview() {
  const navigate = useNavigate();

  return (
    <section className={styles.section}>
      <GlowText
        as="h2"
        size="medium"
        color="orange"
        className={styles.sectionTitle}
      >
        PROJECTS
      </GlowText>
      <p className={styles.blurb}>
        Web applications I've designed, built, and shipped — each solving a real
        problem with modern tech.
      </p>
      <div className={styles.grid}>
        {projects.map((project) => (
          <ProjectCard key={project.title} {...project} />
        ))}
      </div>
      <div className={styles.projectsLink}>
        <Button variant="secondary" onClick={() => navigate('/projects')}>
          View All Projects →
        </Button>
      </div>
    </section>
  );
}

export default ProjectsPreview;
