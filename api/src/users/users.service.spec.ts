import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { PrismaService } from '../prisma/prisma.service';

describe('UsersService', () => {
  let service: UsersService;
  let prismaService: jest.Mocked<PrismaService>;

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
    const mockPrismaService = {
      user: {
        create: jest.fn(),
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    prismaService = module.get(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new user', async () => {
      const createData = {
        email: 'test@example.com',
        username: 'testuser',
        password: 'hashedPassword',
        displayName: 'Test User',
      };

      prismaService.user.create.mockResolvedValue(mockUser);

      const result = await service.create(createData);

      expect(prismaService.user.create).toHaveBeenCalledWith({
        data: createData,
      });
      expect(result).toEqual(mockUser);
    });
  });

  describe('findById', () => {
    it('should find a user by id', async () => {
      prismaService.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.findById('user-1');

      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-1' },
      });
      expect(result).toEqual(mockUser);
    });

    it('should return null if user not found', async () => {
      prismaService.user.findUnique.mockResolvedValue(null);

      const result = await service.findById('invalid-id');

      expect(result).toBeNull();
    });
  });

  describe('findByEmail', () => {
    it('should find a user by email', async () => {
      prismaService.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.findByEmail('test@example.com');

      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
      });
      expect(result).toEqual(mockUser);
    });
  });

  describe('findByUsername', () => {
    it('should find a user by username', async () => {
      prismaService.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.findByUsername('testuser');

      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { username: 'testuser' },
      });
      expect(result).toEqual(mockUser);
    });
  });

  describe('findByEmailOrUsername', () => {
    it('should find a user by email or username', async () => {
      prismaService.user.findFirst.mockResolvedValue(mockUser);

      const result = await service.findByEmailOrUsername(
        'test@example.com',
        'testuser',
      );

      expect(prismaService.user.findFirst).toHaveBeenCalledWith({
        where: {
          OR: [{ email: 'test@example.com' }, { username: 'testuser' }],
        },
      });
      expect(result).toEqual(mockUser);
    });
  });

  describe('update', () => {
    it('should update a user', async () => {
      const updateData = { displayName: 'Updated Name' };
      const updatedUser = { ...mockUser, displayName: 'Updated Name' };

      prismaService.user.update.mockResolvedValue(updatedUser);

      const result = await service.update('user-1', updateData);

      expect(prismaService.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: updateData,
      });
      expect(result).toEqual(updatedUser);
    });
  });

  describe('delete', () => {
    it('should delete a user', async () => {
      prismaService.user.delete.mockResolvedValue(mockUser);

      const result = await service.delete('user-1');

      expect(prismaService.user.delete).toHaveBeenCalledWith({
        where: { id: 'user-1' },
      });
      expect(result).toEqual(mockUser);
    });
  });
});
