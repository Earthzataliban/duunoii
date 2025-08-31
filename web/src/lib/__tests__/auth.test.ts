import { AuthService } from '../auth';

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

// Mock fetch
global.fetch = jest.fn();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('AuthService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockReset();
  });

  describe('Token Management', () => {
    it('should get token from localStorage', () => {
      localStorageMock.getItem.mockReturnValue('test-token');
      
      const token = AuthService.getToken();
      
      expect(localStorageMock.getItem).toHaveBeenCalledWith('token');
      expect(token).toBe('test-token');
    });

    it('should return null when no token exists', () => {
      localStorageMock.getItem.mockReturnValue(null);
      
      const token = AuthService.getToken();
      
      expect(token).toBeNull();
    });

    it('should set token in localStorage', () => {
      const testToken = 'new-test-token';
      
      AuthService.setToken(testToken);
      
      expect(localStorageMock.setItem).toHaveBeenCalledWith('token', testToken);
    });

    it('should remove token from localStorage', () => {
      AuthService.removeToken();
      
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('token');
    });

    it('should handle SSR environment gracefully', () => {
      // Mock SSR environment
      const originalWindow = global.window;
      delete (global as Record<string, unknown>).window;

      expect(AuthService.getToken()).toBeNull();
      
      AuthService.setToken('test');
      AuthService.removeToken();

      // Restore window
      global.window = originalWindow;
    });
  });

  describe('Registration', () => {
    const mockRegisterData = {
      email: 'test@example.com',
      username: 'testuser',
      password: 'password123',
      displayName: 'Test User',
    };

    const mockAuthResponse = {
      user: {
        id: '1',
        email: 'test@example.com',
        username: 'testuser',
        displayName: 'Test User',
        avatar: null,
        createdAt: '2024-01-01',
      },
      token: 'auth-token-123',
    };

    it('should register user successfully', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: mockAuthResponse,
        }),
      });

      const result = await AuthService.register(mockRegisterData);

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:8080/auth/register',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(mockRegisterData),
        }
      );

      expect(localStorageMock.setItem).toHaveBeenCalledWith('token', 'auth-token-123');
      expect(result).toEqual(mockAuthResponse);
    });

    it('should handle registration failure', async () => {
      const errorResponse = {
        message: 'Email already exists',
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => errorResponse,
      });

      await expect(AuthService.register(mockRegisterData)).rejects.toThrow('Email already exists');
      expect(localStorageMock.setItem).not.toHaveBeenCalled();
    });

    it('should handle API response without data wrapper', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockAuthResponse,
      });

      const result = await AuthService.register(mockRegisterData);

      expect(result).toEqual(mockAuthResponse);
      expect(localStorageMock.setItem).toHaveBeenCalledWith('token', 'auth-token-123');
    });
  });

  describe('Login', () => {
    const mockLoginData = {
      identifier: 'test@example.com',
      password: 'password123',
    };

    const mockAuthResponse = {
      user: {
        id: '1',
        email: 'test@example.com',
        username: 'testuser',
        displayName: 'Test User',
        avatar: null,
        createdAt: '2024-01-01',
      },
      token: 'auth-token-456',
    };

    it('should login user successfully', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: mockAuthResponse,
        }),
      });

      const result = await AuthService.login(mockLoginData);

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:8080/auth/login',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(mockLoginData),
        }
      );

      expect(localStorageMock.setItem).toHaveBeenCalledWith('token', 'auth-token-456');
      expect(result).toEqual(mockAuthResponse);
    });

    it('should handle login failure', async () => {
      const errorResponse = {
        message: 'Invalid credentials',
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => errorResponse,
      });

      await expect(AuthService.login(mockLoginData)).rejects.toThrow('Invalid credentials');
      expect(localStorageMock.setItem).not.toHaveBeenCalled();
    });
  });

  describe('Get Profile', () => {
    const mockUser = {
      id: '1',
      email: 'test@example.com',
      username: 'testuser',
      displayName: 'Test User',
      avatar: null,
      createdAt: '2024-01-01',
    };

    it('should get user profile successfully', async () => {
      localStorageMock.getItem.mockReturnValue('valid-token');
      
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: mockUser,
        }),
      });

      const result = await AuthService.getProfile();

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:8080/auth/profile',
        {
          headers: {
            Authorization: 'Bearer valid-token',
          },
        }
      );

      expect(result).toEqual(mockUser);
    });

    it('should throw error when no token exists', async () => {
      localStorageMock.getItem.mockReturnValue(null);

      await expect(AuthService.getProfile()).rejects.toThrow('No token found');
    });

    it('should handle 401 unauthorized response', async () => {
      localStorageMock.getItem.mockReturnValue('expired-token');

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 401,
      });

      await expect(AuthService.getProfile()).rejects.toThrow('Token expired');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('token');
    });

    it('should handle other fetch errors', async () => {
      localStorageMock.getItem.mockReturnValue('valid-token');

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      await expect(AuthService.getProfile()).rejects.toThrow('Failed to get profile');
    });

    it('should handle API response without data wrapper', async () => {
      localStorageMock.getItem.mockReturnValue('valid-token');

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockUser,
      });

      const result = await AuthService.getProfile();

      expect(result).toEqual(mockUser);
    });
  });

  describe('Logout', () => {
    it('should remove token from localStorage', () => {
      AuthService.logout();

      expect(localStorageMock.removeItem).toHaveBeenCalledWith('token');
    });
  });
});