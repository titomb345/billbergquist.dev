import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Navbar from './Navbar';

// Wrapper to provide router context
function renderWithRouter(component: React.ReactNode) {
  return render(<MemoryRouter>{component}</MemoryRouter>);
}

describe('Navbar', () => {
  it('renders without crashing', () => {
    renderWithRouter(<Navbar />);
    expect(screen.getByRole('banner')).toBeInTheDocument();
  });

  it('contains navigation links', () => {
    renderWithRouter(<Navbar />);
    const links = screen.getAllByRole('link');

    // Should have links (may be doubled due to StrictMode)
    expect(links.length).toBeGreaterThan(0);
  });

  it('has links to main pages', () => {
    renderWithRouter(<Navbar />);
    const links = screen.getAllByRole('link');

    // Check link hrefs contain expected destinations
    const hrefs = links.map((link) => link.getAttribute('href'));
    expect(hrefs).toContain('/');
    expect(hrefs).toContain('/about');
    expect(hrefs).toContain('/arcade');
  });
});
