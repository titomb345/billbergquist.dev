import usePageMeta from '../hooks/usePageMeta';
import GlowText from '../components/ui/GlowText';
import ProjectCard from '../components/projects/ProjectCard';
import useScrollReveal from '../hooks/useScrollReveal';
import styles from './ProjectsPage.module.css';

const projects = [
  {
    title: 'CreatiCalc',
    description:
      'Free calculator suite for content creators. Estimate YouTube ad revenue, calculate engagement rates, and find sponsorship pricing across YouTube, Instagram, TikTok, Facebook, and X.',
    techStack: ['Next.js', 'React', 'TypeScript', 'Tailwind CSS'],
    url: 'https://creaticalc.com',
    color: 'mint' as const,
    wireframe: 'dashboard' as const,
  },
  {
    title: 'Sports Shortcuts',
    description:
      'Injury and status alert generator for sports reporters and social media managers. Quickly create standardized NFL and NBA game-day messages with autocomplete player search.',
    techStack: ['React', 'TypeScript', 'Material UI', 'Vite'],
    url: 'https://sportsshortcuts.com',
    color: 'magenta' as const,
    wireframe: 'form' as const,
  },
  {
    title: 'Critter Care',
    description:
      'Professional pet sitting and dog walking business website for the South Bay area. Features service listings, testimonials, photo gallery, and CMS-powered content management.',
    techStack: ['Astro', 'Tailwind CSS', 'Decap CMS'],
    url: 'https://critter-care.com',
    color: 'purple' as const,
    wireframe: 'landing' as const,
  },
];

function ProjectsPage() {
  usePageMeta({
    title: 'Projects — Bill Bergquist',
    description:
      'Web projects by Bill Bergquist: CreatiCalc, Sports Shortcuts, and Critter Care. Built with React, Astro, TypeScript, and modern web technologies.',
    canonical: '/projects',
  });

  const gridRef = useScrollReveal<HTMLElement>();

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <GlowText size="large" color="orange" animated className={styles.title}>
          PROJECTS
        </GlowText>
        <p className={styles.intro}>
          A collection of web applications I've designed, built, and shipped.
          Each project solves a real problem using modern web technologies.
        </p>
        <div className="accent-line-orange" />
      </header>

      <main className={`${styles.grid} scroll-reveal`} ref={gridRef}>
        {projects.map((project) => (
          <div key={project.title} className="scroll-reveal-child">
            <ProjectCard {...project} />
          </div>
        ))}
      </main>
    </div>
  );
}

export default ProjectsPage;
