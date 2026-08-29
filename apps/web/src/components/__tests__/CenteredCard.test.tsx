import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CenteredCard } from '@/components/CenteredCard';

// Mock the CSS import so jsdom doesn't choke on it
vi.mock('@/styles/CenteredCard.css', () => ({}));

describe('CenteredCard', () => {
  it('renders its children', () => {
    render(<CenteredCard><p>Hello world</p></CenteredCard>);
    expect(screen.getByText('Hello world')).toBeInTheDocument();
  });

  it('applies an additional className when provided', () => {
    const { container } = render(
      <CenteredCard className="custom-class">
        <span>Content</span>
      </CenteredCard>,
    );
    const card = container.querySelector('.centered-card');
    expect(card).toHaveClass('centered-card', 'custom-class');
  });

  it('does not add extra class when className is omitted', () => {
    const { container } = render(
      <CenteredCard><span>Content</span></CenteredCard>,
    );
    const card = container.querySelector('.centered-card');
    expect(card?.className).toBe('centered-card');
  });

  it('applies maxWidth as inline style when provided', () => {
    const { container } = render(
      <CenteredCard maxWidth="480px"><span>Content</span></CenteredCard>,
    );
    const card = container.querySelector('.centered-card') as HTMLElement;
    expect(card.style.maxWidth).toBe('480px');
  });
});
