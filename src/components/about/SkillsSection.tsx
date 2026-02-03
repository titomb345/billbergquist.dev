import GlowText from '../ui/GlowText';
import styles from './SkillsSection.module.css';

interface SkillCategory {
  name: string;
  skills: string[];
}

const skillCategories: SkillCategory[] = [
  {
    name: 'Frontend',
    skills: ['React', 'Vue', 'TypeScript', 'JavaScript', 'HTML', 'CSS'],
  },
  {
    name: 'Libraries & UI',
    skills: ['Redux', 'React Query', 'MUI', 'NX', 'Vite'],
  },
  {
    name: 'Backend & Cloud',
    skills: ['Node.js', 'NestJS', 'AWS', 'MongoDB', 'GraphQL'],
  },
  {
    name: 'Tools & Practices',
    skills: ['Git', 'GitHub', 'JIRA', 'CI/CD', 'Jest', 'Vitest', 'Agile'],
  },
  {
    name: 'Artificial Intelligence',
    skills: ['Claude Code', 'Cursor', 'Agentic Workflows', 'Prompt Engineering'],
  },
  {
    name: 'Leadership',
    skills: ['Mentoring', 'Technical Writing', 'Code Review', 'Cross-Team Collaboration'],
  },
];

function SkillsSection() {
  return (
    <section className={styles.section}>
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
          <div key={category.name} className={styles.category}>
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
