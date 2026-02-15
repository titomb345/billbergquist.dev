import { useEffect } from 'react';
import usePageMeta from '../hooks/usePageMeta';
import Hero from '../components/home/Hero';
import AboutSection from '../components/home/AboutSection';
import ProjectsPreview from '../components/home/ProjectsPreview';
import GameGrid from '../components/home/GameGrid';
import SectionDivider from '../components/ui/SectionDivider';

const JSONLD_PERSON = JSON.stringify({
  '@context': 'https://schema.org',
  '@type': 'Person',
  name: 'Bill Bergquist',
  jobTitle: 'Staff Software Engineer',
  url: 'https://billbergquist.com',
  sameAs: [
    'https://github.com/titomb345',
    'https://www.linkedin.com/in/bill-bergquist/',
  ],
});

const JSONLD_WEBSITE = JSON.stringify({
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'Bill Bergquist',
  url: 'https://billbergquist.com',
});

function HomePage() {
  usePageMeta({
    title: 'Bill Bergquist — Staff Software Engineer',
    description:
      'Staff software engineer with 14+ years of experience building web applications with React, TypeScript, and Node.js.',
    canonical: '/',
  });

  useEffect(() => {
    const ids = ['jsonld-person', 'jsonld-website'];
    const data = [JSONLD_PERSON, JSONLD_WEBSITE];
    ids.forEach((id, i) => {
      let script = document.getElementById(id) as HTMLScriptElement | null;
      if (!script) {
        script = document.createElement('script');
        script.id = id;
        script.type = 'application/ld+json';
        document.head.appendChild(script);
      }
      script.textContent = data[i];
    });
    return () => {
      ids.forEach((id) => document.getElementById(id)?.remove());
    };
  }, []);

  return (
    <>
      <Hero />
      <SectionDivider color="mint" />
      <AboutSection />
      <SectionDivider color="orange" />
      <ProjectsPreview />
      <SectionDivider color="magenta" />
      <GameGrid />
    </>
  );
}

export default HomePage;
