import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import UploadPage from '../page';
import { useAuth } from '@/contexts/AuthContext';
import { AuthService } from '@/lib/auth';

// Mock dependencies
jest.mock('@/contexts/AuthContext');
jest.mock('@/lib/auth');

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockAuthService = AuthService as jest.Mocked<typeof AuthService>;

describe('Upload Page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuthService.getToken.mockReturnValue('mock-token');
  });

  describe('Authentication', () => {
    it('redirects to home when user is not authenticated', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        login: jest.fn(),
        register: jest.fn(),
        logout: jest.fn(),
      });

      render(<UploadPage />);

      expect(screen.getByText('Please login to upload videos')).toBeInTheDocument();
      expect(screen.getByText('Go to Home')).toBeInTheDocument();
    });

    it('shows upload interface when user is authenticated', () => {
      mockUseAuth.mockReturnValue({
        user: {
          id: '1',
          email: 'test@example.com',
          username: 'testuser',
          displayName: 'Test User',
          avatar: null,
          createdAt: '2024-01-01',
        },
        isAuthenticated: true,
        isLoading: false,
        login: jest.fn(),
        register: jest.fn(),
        logout: jest.fn(),
      });

      render(<UploadPage />);

      expect(screen.getByRole('heading', { name: 'Upload Video' })).toBeInTheDocument();
      expect(screen.getByText('Drop your video here')).toBeInTheDocument();
    });
  });

  describe('Form Fields', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: {
          id: '1',
          email: 'test@example.com',
          username: 'testuser',
          displayName: 'Test User',
          avatar: null,
          createdAt: '2024-01-01',
        },
        isAuthenticated: true,
        isLoading: false,
        login: jest.fn(),
        register: jest.fn(),
        logout: jest.fn(),
      });
    });

    it('renders title and description inputs', () => {
      render(<UploadPage />);

      expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
    });

    it('updates title when user types', () => {
      render(<UploadPage />);

      const titleInput = screen.getByLabelText(/title/i) as HTMLInputElement;
      fireEvent.change(titleInput, { target: { value: 'Test Video Title' } });

      expect(titleInput.value).toBe('Test Video Title');
    });

    it('updates description when user types', () => {
      render(<UploadPage />);

      const descriptionInput = screen.getByLabelText(/description/i) as HTMLTextAreaElement;
      fireEvent.change(descriptionInput, { target: { value: 'Test video description' } });

      expect(descriptionInput.value).toBe('Test video description');
    });

    it('shows character count for title', () => {
      render(<UploadPage />);

      expect(screen.getByText(/\/100 characters/)).toBeInTheDocument();
    });

    it('shows character count for description', () => {
      render(<UploadPage />);

      expect(screen.getByText(/\/1000 characters/)).toBeInTheDocument();
    });

    it('disables upload button when no file is selected', () => {
      render(<UploadPage />);

      const uploadButton = screen.getByRole('button', { name: /upload video/i });
      expect(uploadButton).toBeDisabled();
    });
  });

  describe('Debug Information', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: {
          id: '1',
          email: 'test@example.com',
          username: 'testuser',
          displayName: 'Test User',
          avatar: null,
          createdAt: '2024-01-01',
        },
        isAuthenticated: true,
        isLoading: false,
        login: jest.fn(),
        register: jest.fn(),
        logout: jest.fn(),
      });
    });

    it('shows authentication status in debug info', () => {
      render(<UploadPage />);

      expect(screen.getByText('• User authenticated: Yes')).toBeInTheDocument();
    });

    it('shows token status in debug info', () => {
      render(<UploadPage />);

      expect(screen.getByText('• AuthService Token: Found')).toBeInTheDocument();
    });
  });
});