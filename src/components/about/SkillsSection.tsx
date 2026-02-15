import GlowText from '../ui/GlowText';
import useScrollReveal from '../../hooks/useScrollReveal';
import styles from './SkillsSection.module.css';

interface SkillCategory {
  name: string;
  skills: string[];
  accent: 'mint' | 'magenta' | 'purple' | 'orange';
}

const skillCategories: SkillCategory[] = [
  {
    name: 'Frontend',
    skills: ['React', 'Vue', 'TypeScript', 'JavaScript', 'HTML', 'CSS'],
    accent: 'mint',
  },
  {
    name: 'Libraries & UI',
    skills: ['Redux', 'React Query', 'MUI', 'NX', 'Vite'],
    accent: 'mint',
  },
  {
    name: 'Backend & Cloud',
    skills: ['Node.js', 'NestJS', 'AWS', 'MongoDB', 'GraphQL'],
    accent: 'purple',
  },
  {
    name: 'Tools & Practices',
    skills: ['Git', 'GitHub', 'JIRA', 'CI/CD', 'Jest', 'Vitest', 'Agile'],
    accent: 'orange',
  },
  {
    name: 'Artificial Intelligence',
    skills: ['Claude Code', 'Cursor', 'Agentic Workflows', 'Prompt Engineering'],
    accent: 'magenta',
  },
  {
    name: 'Leadership',
    skills: ['Mentoring', 'Technical Writing', 'Code Review', 'Cross-Team Collaboration'],
    accent: 'orange',
  },
];

function SkillsSection() {
  const sectionRef = useScrollReveal<HTMLElement>();

  return (
    <section className={`${styles.section} scroll-reveal`} ref={sectionRef}>
      <GlowText
        as="h2"
        size="medium"
        color="mint"
        className={styles.sectionTitle}
      >
        SKILLS
      </GlowText>
      <div className={styles.categories}>
        {skillCategories.map((category) => (
          <div
            key={category.name}
            className={`${styles.category} ${styles[`accent_${category.accent}`]}`}
          >
            <h3 className={styles.categoryName}>{category.name}</h3>
            <div className={styles.skills}>
              {category.skills.map((skill) => (
                <span key={skill} className={styles.skill}>
                  {skill}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default SkillsSection;
