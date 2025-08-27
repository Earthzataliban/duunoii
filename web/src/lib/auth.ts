const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export interface User {
  id: string;
  email: string;
  username: string;
  displayName: string;
  avatar: string | null;
  createdAt: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface LoginData {
  identifier: string;
  password: string;
}

export interface RegisterData {
  email: string;
  username: string;
  password: string;
  displayName?: string;
}

export class AuthService {
  private static TOKEN_KEY = 'auth_token';

  static getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(this.TOKEN_KEY);
  }

  static setToken(token: string): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(this.TOKEN_KEY, token);
  }

  static removeToken(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(this.TOKEN_KEY);
  }

  static async register(data: RegisterData): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Registration failed');
    }

    const result = await response.json();
    this.setToken(result.token);
    return result;
  }

  static async login(data: LoginData): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Login failed');
    }

    const result = await response.json();
    this.setToken(result.token);
    return result;
  }

  static async getProfile(): Promise<User> {
    const token = this.getToken();
    if (!token) {
      throw new Error('No token found');
    }

    const response = await fetch(`${API_BASE_URL}/auth/profile`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        this.removeToken();
        throw new Error('Token expired');
      }
      throw new Error('Failed to get profile');
    }

    return response.json();
  }

  static logout(): void {
    this.removeToken();
  }
}