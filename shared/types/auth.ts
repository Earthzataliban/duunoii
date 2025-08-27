export interface LoginDto {
  email: string;
  password: string;
}

export interface RegisterDto {
  email: string;
  username: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    username: string;
    firstName?: string;
    lastName?: string;
    avatar?: string;
  };
  accessToken: string;
  refreshToken: string;
}

export interface JwtPayload {
  sub: string;
  email: string;
  username: string;
  iat?: number;
  exp?: number;
}