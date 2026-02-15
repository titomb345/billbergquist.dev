import GlowText from '../ui/GlowText';
import styles from './ExperienceTimeline.module.css';

interface Role {
  title: string;
  period: string;
  description?: string;
  highlights?: string[];
}

interface Experience {
  company: string;
  period: string;
  roles: Role[];
  isFeatured?: boolean;
}

const experiences: Experience[] = [
  {
    company: 'Kasa',
    period: 'Nov 2020 - Present',
    isFeatured: true,
    roles: [
      {
        title: 'Staff Software Engineer',
        period: 'Oct 2023 - Present',
        description:
          'Leading frontend architecture and expanding into full stack development. Building internal tooling and developer experiences that accelerate team productivity across the organization.',
        highlights: [
          'Architecting scalable frontend solutions using React, TypeScript, and NX monorepos',
          'Pioneering AI-assisted development workflows using Claude Code for rapid prototyping',
          'Mentoring engineers and driving best practices across multiple teams',
          'Building full stack features with NestJS, MongoDB, and AWS',
          'Leading cross-team initiatives to improve developer experience and tooling',
        ],
      },
      {
        title: 'Senior Software Engineer',
        period: 'Mar 2022 - Oct 2023',
        description:
          'Developed core platform features and mentored junior engineers on frontend best practices.',
      },
      {
        title: 'Software Engineer III',
        period: 'Nov 2020 - Mar 2022',
        description:
          'Built and maintained React applications for the hospitality management platform.',
      },
    ],
  },
  {
    company: 'Evite',
    period: '2019 - Nov 2020',
    roles: [
      {
        title: 'Senior Software Engineer',
        period: '2019 - Nov 2020',
      },
    ],
  },
  {
    company: 'Varius Solutions',
    period: '2018 - 2019',
    roles: [
      {
        title: 'Senior Software Engineer',
        period: '2018 - 2019',
      },
    ],
  },
  {
    company: 'RevCascade',
    period: '2016 - 2018',
    roles: [
      {
        title: 'Senior Software Engineer',
        period: '2016 - 2018',
      },
    ],
  },
  {
    company: 'NRG Home Solar',
    period: '2015 - 2016',
    roles: [
      {
        title: 'Software Engineer',
        period: '2015 - 2016',
      },
    ],
  },
  {
    company: 'GumGum',
    period: '2014 - 2015',
    roles: [
      {
        title: 'Software Engineer',
        period: '2014 - 2015',
      },
    ],
  },
  {
    company: 'PriceGrabber',
    period: '2011 - 2014',
    roles: [
      {
        title: 'Software Engineer',
        period: '2011 - 2014',
      },
    ],
  },
];

function ExperienceTimeline() {
  return (
    <section className={styles.section}>
      <GlowText
        as="h2"
        size="medium"
        color="magenta"
        className={styles.sectionTitle}
      >
        EXPERIENCE
      </GlowText>
      <div className={styles.timeline}>
        {experiences.map((exp, index) => (
          <div
            key={index}
            className={`${styles.item} ${exp.isFeatured ? styles.featured : ''}`}
          >
            <div className={styles.marker} />
            <div className={styles.content}>
              <div className={styles.header}>
                <h3 className={styles.company}>{exp.company}</h3>
                <span className={styles.period}>{exp.period}</span>
              </div>

              {exp.roles.length === 1 ? (
                // Single role - simple display
                <>
                  <p className={styles.title}>{exp.roles[0].title}</p>
                  {exp.roles[0].description && (
                    <p className={styles.description}>
                      {exp.roles[0].description}
                    </p>
                  )}
                </>
              ) : (
                // Multiple roles - show promotion timeline
                <div className={styles.promotionTrack}>
                  {exp.roles.map((role, roleIndex) => (
                    <div
                      key={roleIndex}
                      className={`${styles.role} ${roleIndex === 0 ? styles.currentRole : ''}`}
                    >
                      <div className={styles.roleMarker}>
                        <div className={styles.roleMarkerDot} />
                        {roleIndex < exp.roles.length - 1 && (
                          <div className={styles.roleMarkerLine} />
                        )}
                      </div>
                      <div className={styles.roleContent}>
                        <div className={styles.roleHeader}>
                          <span className={styles.roleTitle}>{role.title}</span>
                          <span className={styles.rolePeriod}>
                            {role.period}
                          </span>
                        </div>
                        {role.description && (
                          <p className={styles.roleDescription}>
                            {role.description}
                          </p>
                        )}
                        {role.highlights && (
                          <ul className={styles.highlights}>
                            {role.highlights.map((highlight, i) => (
                              <li key={i} className={styles.highlight}>
                                {highlight}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default ExperienceTimeline;
