import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcryptjs';

jest.mock('bcryptjs');
const mockedBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

describe('AuthService', () => {
  let service: AuthService;
  let usersService: jest.Mocked<UsersService>;
  let jwtService: jest.Mocked<JwtService>;

  const mockUser = {
    id: 'user-1',
    email: 'test@example.com',
    username: 'testuser',
    password: 'hashedPassword',
    displayName: 'Test User',
    firstName: null,
    lastName: null,
    avatar: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const mockUsersService = {
      findByEmailOrUsername: jest.fn(),
      create: jest.fn(),
      findById: jest.fn(),
    };

    const mockJwtService = {
      sign: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get(UsersService);
    jwtService = module.get(JwtService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
    const registerDto = {
      email: 'test@example.com',
      username: 'testuser',
      password: 'password123',
      displayName: 'Test User',
    };

    it('should successfully register a new user', async () => {
      usersService.findByEmailOrUsername.mockResolvedValue(null);
      mockedBcrypt.hash.mockResolvedValue('hashedPassword' as never);
      usersService.create.mockResolvedValue(mockUser);
      jwtService.sign.mockReturnValue('jwt-token');

      const result = await service.register(registerDto);

      expect(usersService.findByEmailOrUsername).toHaveBeenCalledWith(
        'test@example.com',
        'testuser',
      );
      expect(mockedBcrypt.hash).toHaveBeenCalledWith('password123', 12);
      expect(usersService.create).toHaveBeenCalledWith({
        email: 'test@example.com',
        username: 'testuser',
        password: 'hashedPassword',
        displayName: 'Test User',
      });
      expect(jwtService.sign).toHaveBeenCalledWith({
        sub: 'user-1',
        email: 'test@example.com',
      });
      expect(result).toEqual({
        user: {
          id: 'user-1',
          email: 'test@example.com',
          username: 'testuser',
          displayName: 'Test User',
          avatar: null,
          createdAt: mockUser.createdAt,
        },
        token: 'jwt-token',
      });
    });

    it('should throw ConflictException if email already exists', async () => {
      usersService.findByEmailOrUsername.mockResolvedValue(mockUser);

      await expect(service.register(registerDto)).rejects.toThrow(
        ConflictException,
      );
      await expect(service.register(registerDto)).rejects.toThrow(
        'Email already exists',
      );
    });
  });

  describe('login', () => {
    const loginDto = {
      identifier: 'test@example.com',
      password: 'password123',
    };

    it('should successfully login with valid credentials', async () => {
      usersService.findByEmailOrUsername.mockResolvedValue(mockUser);
      mockedBcrypt.compare.mockResolvedValue(true as never);
      jwtService.sign.mockReturnValue('jwt-token');

      const result = await service.login(loginDto);

      expect(usersService.findByEmailOrUsername).toHaveBeenCalledWith(
        'test@example.com',
        'test@example.com',
      );
      expect(mockedBcrypt.compare).toHaveBeenCalledWith(
        'password123',
        'hashedPassword',
      );
      expect(result).toEqual({
        user: {
          id: 'user-1',
          email: 'test@example.com',
          username: 'testuser',
          displayName: 'Test User',
          avatar: null,
          createdAt: mockUser.createdAt,
        },
        token: 'jwt-token',
      });
    });

    it('should throw UnauthorizedException if user not found', async () => {
      usersService.findByEmailOrUsername.mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(service.login(loginDto)).rejects.toThrow(
        'Invalid credentials',
      );
    });

    it('should throw UnauthorizedException if password is invalid', async () => {
      usersService.findByEmailOrUsername.mockResolvedValue(mockUser);
      mockedBcrypt.compare.mockResolvedValue(false as never);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(service.login(loginDto)).rejects.toThrow(
        'Invalid credentials',
      );
    });
  });

  describe('validateUser', () => {
    it('should return user data for valid user id', async () => {
      usersService.findById.mockResolvedValue(mockUser);

      const result = await service.validateUser('user-1');

      expect(usersService.findById).toHaveBeenCalledWith('user-1');
      expect(result).toEqual({
        id: 'user-1',
        email: 'test@example.com',
        username: 'testuser',
        displayName: 'Test User',
        avatar: null,
        createdAt: mockUser.createdAt,
      });
    });

    it('should throw UnauthorizedException if user not found', async () => {
      usersService.findById.mockResolvedValue(null);

      await expect(service.validateUser('invalid-id')).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(service.validateUser('invalid-id')).rejects.toThrow(
        'User not found',
      );
    });
  });
});
