import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { usePathname } from 'next/navigation';
import { Sidebar } from '../Sidebar';

// Mock usePathname
jest.mock('next/navigation', () => ({
  usePathname: jest.fn(),
}));
const mockUsePathname = usePathname as jest.MockedFunction<typeof usePathname>;

describe('Sidebar', () => {
  const mockOnToggle = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockUsePathname.mockReturnValue('/');
  });

  describe('Rendering', () => {
    it('renders main navigation items', () => {
      render(<Sidebar isCollapsed={false} onToggle={mockOnToggle} />);

      expect(screen.getByText('Home')).toBeInTheDocument();
      expect(screen.getByText('Watch')).toBeInTheDocument();
      expect(screen.getByText('Subscriptions')).toBeInTheDocument();
      expect(screen.getByText('Upload')).toBeInTheDocument();
    });

    it('renders library section when not collapsed', () => {
      render(<Sidebar isCollapsed={false} onToggle={mockOnToggle} />);

      expect(screen.getByRole('heading', { name: /library/i })).toBeInTheDocument();
      expect(screen.getByText('History')).toBeInTheDocument();
      expect(screen.getByText('Watch later')).toBeInTheDocument();
      expect(screen.getByText('Liked videos')).toBeInTheDocument();
    });

    it('hides library section when collapsed', () => {
      render(<Sidebar isCollapsed={true} onToggle={mockOnToggle} />);

      expect(screen.queryByRole('heading', { name: /library/i })).not.toBeInTheDocument();
      expect(screen.queryByText('History')).not.toBeInTheDocument();
      expect(screen.queryByText('Watch later')).not.toBeInTheDocument();
      expect(screen.queryByText('Liked videos')).not.toBeInTheDocument();
    });

    it('highlights active navigation item', () => {
      mockUsePathname.mockReturnValue('/upload');
      render(<Sidebar isCollapsed={false} onToggle={mockOnToggle} />);

      const uploadLink = screen.getByRole('link', { name: /upload/i });
      expect(uploadLink).toHaveClass('bg-secondary', 'text-secondary-foreground');
    });

    it('shows icons for navigation items', () => {
      render(<Sidebar isCollapsed={false} onToggle={mockOnToggle} />);

      // Check if SVG icons are present (lucide-react icons)
      const homeIcon = screen.getByRole('link', { name: /home/i }).querySelector('svg');
      const uploadIcon = screen.getByRole('link', { name: /upload/i }).querySelector('svg');
      
      expect(homeIcon).toBeInTheDocument();
      expect(uploadIcon).toBeInTheDocument();
    });
  });

  describe('Responsive Behavior', () => {
    it('shows overlay on mobile when not collapsed', () => {
      render(<Sidebar isCollapsed={false} onToggle={mockOnToggle} />);

      const overlay = document.querySelector('.fixed.inset-0.bg-black\\/50');
      expect(overlay).toBeInTheDocument();
    });

    it('hides overlay on mobile when collapsed', () => {
      render(<Sidebar isCollapsed={true} onToggle={mockOnToggle} />);

      const overlay = document.querySelector('.fixed.inset-0.bg-black\\/50');
      expect(overlay).not.toBeInTheDocument();
    });

    it('shows close button on mobile', () => {
      render(<Sidebar isCollapsed={false} onToggle={mockOnToggle} />);

      const closeButton = screen.getByRole('button');
      expect(closeButton).toBeInTheDocument();
    });

    it('calls onToggle when close button is clicked', () => {
      render(<Sidebar isCollapsed={false} onToggle={mockOnToggle} />);

      const closeButton = screen.getByRole('button');
      fireEvent.click(closeButton);

      expect(mockOnToggle).toHaveBeenCalledTimes(1);
    });

    it('calls onToggle when overlay is clicked', () => {
      render(<Sidebar isCollapsed={false} onToggle={mockOnToggle} />);

      const overlay = document.querySelector('.fixed.inset-0.bg-black\\/50') as HTMLElement;
      fireEvent.click(overlay);

      expect(mockOnToggle).toHaveBeenCalledTimes(1);
    });
  });

  describe('Navigation Links', () => {
    it('has correct href attributes for navigation items', () => {
      render(<Sidebar isCollapsed={false} onToggle={mockOnToggle} />);

      expect(screen.getByRole('link', { name: /home/i })).toHaveAttribute('href', '/');
      expect(screen.getByRole('link', { name: /^watch$/i })).toHaveAttribute('href', '/watch');
      expect(screen.getByRole('link', { name: /subscriptions/i })).toHaveAttribute('href', '/subscriptions');
      expect(screen.getByRole('link', { name: /upload/i })).toHaveAttribute('href', '/upload');
    });

    it('has correct href attributes for library items', () => {
      render(<Sidebar isCollapsed={false} onToggle={mockOnToggle} />);

      expect(screen.getByRole('link', { name: /^library$/i })).toHaveAttribute('href', '/library');
      expect(screen.getByRole('link', { name: /history/i })).toHaveAttribute('href', '/history');
      expect(screen.getByRole('link', { name: /watch later/i })).toHaveAttribute('href', '/watch-later');
      expect(screen.getByRole('link', { name: /liked videos/i })).toHaveAttribute('href', '/liked');
    });
  });

  describe('Collapsed State', () => {
    it('applies correct CSS classes when collapsed', () => {
      render(<Sidebar isCollapsed={true} onToggle={mockOnToggle} />);

      const sidebar = screen.getByRole('complementary', { hidden: true });
      expect(sidebar).toHaveClass('-translate-x-full', 'md:translate-x-0', 'md:w-16');
    });

    it('applies correct CSS classes when expanded', () => {
      render(<Sidebar isCollapsed={false} onToggle={mockOnToggle} />);

      const sidebar = screen.getByRole('complementary', { hidden: true });
      expect(sidebar).toHaveClass('w-64', 'md:w-full');
      expect(sidebar).not.toHaveClass('-translate-x-full');
    });

    it('centers icons when collapsed', () => {
      render(<Sidebar isCollapsed={true} onToggle={mockOnToggle} />);

      const links = screen.getAllByRole('link');
      const homeLink = links.find(link => link.getAttribute('href') === '/');
      
      expect(homeLink).toHaveClass('justify-center');
      expect(homeLink).toHaveClass('w-10', 'px-0');
    });

    it('shows text labels when expanded', () => {
      render(<Sidebar isCollapsed={false} onToggle={mockOnToggle} />);

      const homeLink = screen.getByRole('link', { name: /home/i });
      expect(homeLink).not.toHaveClass('justify-center');
      expect(homeLink).not.toHaveClass('space-x-0');
      expect(screen.getByText('Home')).toBeInTheDocument();
    });
  });

  describe('Active State', () => {
    it('highlights home link when on home page', () => {
      mockUsePathname.mockReturnValue('/');
      render(<Sidebar isCollapsed={false} onToggle={mockOnToggle} />);

      const homeLink = screen.getByRole('link', { name: /home/i });
      expect(homeLink).toHaveClass('bg-secondary', 'text-secondary-foreground');
    });

    it('highlights upload link when on upload page', () => {
      mockUsePathname.mockReturnValue('/upload');
      render(<Sidebar isCollapsed={false} onToggle={mockOnToggle} />);

      const uploadLink = screen.getByRole('link', { name: /upload/i });
      expect(uploadLink).toHaveClass('bg-secondary', 'text-secondary-foreground');
    });

    it('highlights library items when active', () => {
      mockUsePathname.mockReturnValue('/history');
      render(<Sidebar isCollapsed={false} onToggle={mockOnToggle} />);

      const historyLink = screen.getByRole('link', { name: /history/i });
      expect(historyLink).toHaveClass('bg-secondary', 'text-secondary-foreground');
    });

    it('applies inactive styles to non-active items', () => {
      mockUsePathname.mockReturnValue('/upload');
      render(<Sidebar isCollapsed={false} onToggle={mockOnToggle} />);

      const homeLink = screen.getByRole('link', { name: /home/i });
      expect(homeLink).toHaveClass('hover:bg-accent', 'hover:text-accent-foreground');
      expect(homeLink).not.toHaveClass('bg-secondary', 'text-secondary-foreground');
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA attributes', () => {
      render(<Sidebar isCollapsed={false} onToggle={mockOnToggle} />);

      const sidebar = screen.getByRole('complementary', { hidden: true });
      expect(sidebar).toBeInTheDocument();
    });

    it('has accessible navigation structure', () => {
      render(<Sidebar isCollapsed={false} onToggle={mockOnToggle} />);

      const navigation = screen.getByRole('navigation');
      expect(navigation).toBeInTheDocument();
    });

    it('has proper heading structure', () => {
      render(<Sidebar isCollapsed={false} onToggle={mockOnToggle} />);

      const libraryHeading = screen.getByRole('heading', { name: /library/i });
      expect(libraryHeading).toBeInTheDocument();
    });
  });
});