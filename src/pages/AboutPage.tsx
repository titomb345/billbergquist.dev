import GlowText from '../components/ui/GlowText';
import ExperienceTimeline from '../components/about/ExperienceTimeline';
import SkillsSection from '../components/about/SkillsSection';
import styles from './AboutPage.module.css';

function AboutPage() {
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <GlowText size="large" color="mint" animated className={styles.title}>
          ABOUT ME
        </GlowText>
        <p className={styles.summary}>
          I'm a Staff Software Engineer with over 14 years of experience
          building web applications. While my roots are in frontend technologies,
          I've been diving deeper into full stack development, working across
          the entire stack to build internal tooling and developer experiences
          that help teams ship faster and more confidently.
        </p>
        <p className={styles.summary}>
          Currently at Kasa, I lead frontend architecture initiatives and build
          tools that accelerate development across the organization. I'm
          passionate about clean code, great user experiences, and helping other
          engineers grow.
        </p>
        <p className={styles.aiHighlight}>
          I embrace AI as a force multiplier in my workflow. Using Claude Code,
          I leverage agentic workflows and prompt engineering to accelerate
          development, automate repetitive tasks, and explore solutions faster
          than ever before.
        </p>
      </header>

      <main className={styles.content}>
        <ExperienceTimeline />
        <SkillsSection />

        <section className={styles.education}>
          <GlowText
            as="h2"
            size="medium"
            color="purple"
            className={styles.sectionTitle}
          >
            EDUCATION
          </GlowText>
          <div className={styles.educationCard}>
            <h3 className={styles.school}>Purdue University</h3>
            <p className={styles.degree}>BS Computer Engineering</p>
            <p className={styles.years}>2006 - 2010</p>
          </div>
        </section>
      </main>
    </div>
  );
}

export default AboutPage;
