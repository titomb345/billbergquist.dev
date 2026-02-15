import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Footer from './Footer';

// Wrapper to provide router context
function renderWithRouter(component: React.ReactNode) {
  return render(<MemoryRouter>{component}</MemoryRouter>);
}

describe('Footer', () => {
  it('renders without crashing', () => {
    renderWithRouter(<Footer />);
    expect(screen.getByRole('contentinfo')).toBeInTheDocument();
  });

  it('contains GitHub link', () => {
    renderWithRouter(<Footer />);
    const links = screen.getAllByRole('link');
    const githubLinks = links.filter(
      (link) => link.getAttribute('href') === 'https://github.com/titomb345',
    );
    expect(githubLinks.length).toBeGreaterThan(0);
  });

  it('contains LinkedIn link', () => {
    renderWithRouter(<Footer />);
    const links = screen.getAllByRole('link');
    const linkedinLinks = links.filter(
      (link) =>
        link.getAttribute('href') ===
        'https://www.linkedin.com/in/bill-bergquist/',
    );
    expect(linkedinLinks.length).toBeGreaterThan(0);
  });

  it('external links open in new tab', () => {
    renderWithRouter(<Footer />);
    const links = screen.getAllByRole('link');
    // Check that at least one link has target="_blank"
    const externalLinks = links.filter(
      (link) => link.getAttribute('target') === '_blank',
    );
    expect(externalLinks.length).toBeGreaterThan(0);
  });
});
