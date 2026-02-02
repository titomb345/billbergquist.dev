import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Card, GameCard } from './Card';

describe('Card', () => {
  it('renders children correctly', () => {
    render(<Card>Test Content</Card>);
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(<Card className="custom-class">Content</Card>);
    expect(container.firstChild).toHaveClass('custom-class');
  });
});

describe('GameCard', () => {
  it('renders title and description', () => {
    render(
      <GameCard
        title="Test Game"
        description="A test game description"
      />
    );

    expect(screen.getByText('Test Game')).toBeInTheDocument();
    expect(screen.getByText('A test game description')).toBeInTheDocument();
  });

  it('renders preview content when provided', () => {
    render(
      <GameCard
        title="Test Game"
        description="Description"
        preview={<div data-testid="preview">Preview Content</div>}
      />
    );

    expect(screen.getByTestId('preview')).toBeInTheDocument();
  });

  it('renders action when not locked', () => {
    render(
      <GameCard
        title="Test Game"
        description="Description"
        action={<button>Play</button>}
      />
    );

    expect(screen.getByRole('button', { name: 'Play' })).toBeInTheDocument();
  });

  it('shows locked state badge when locked', () => {
    render(
      <GameCard
        title="Test Game"
        description="Description"
        locked={true}
      />
    );

    // When locked, should show "Coming Soon" text
    expect(screen.getByText('Coming Soon')).toBeInTheDocument();
  });
});
