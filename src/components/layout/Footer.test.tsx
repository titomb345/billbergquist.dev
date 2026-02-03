import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Footer from './Footer';

describe('Footer', () => {
  it('renders without crashing', () => {
    render(<Footer />);
    expect(screen.getByRole('contentinfo')).toBeInTheDocument();
  });

  it('contains GitHub link', () => {
    render(<Footer />);
    // Use getAllBy since React StrictMode may cause duplicate renders
    const githubLinks = screen.getAllByRole('link', { name: /github/i });
    expect(githubLinks.length).toBeGreaterThan(0);
    expect(githubLinks[0]).toHaveAttribute('href', 'https://github.com/titomb345');
  });

  it('contains LinkedIn link', () => {
    render(<Footer />);
    const linkedinLinks = screen.getAllByRole('link', { name: /linkedin/i });
    expect(linkedinLinks.length).toBeGreaterThan(0);
    expect(linkedinLinks[0]).toHaveAttribute(
      'href',
      'https://www.linkedin.com/in/bill-bergquist/'
    );
  });

  it('external links open in new tab', () => {
    render(<Footer />);
    const links = screen.getAllByRole('link');
    // Check that at least one link has target="_blank"
    const externalLinks = links.filter(
      (link) => link.getAttribute('target') === '_blank'
    );
    expect(externalLinks.length).toBeGreaterThan(0);
  });
});
