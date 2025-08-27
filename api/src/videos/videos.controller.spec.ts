import { Test, TestingModule } from '@nestjs/testing';
import { VideosController } from './videos.controller';
import { VideosService } from './videos.service';
import { PrismaService } from '../prisma/prisma.service';

describe('VideosController', () => {
  let controller: VideosController;
  let service: VideosService;

  const mockVideosService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    incrementViews: jest.fn(),
  };

  const mockPrismaService = {
    video: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [VideosController],
      providers: [
        {
          provide: VideosService,
          useValue: mockVideosService,
        },
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    controller = module.get<VideosController>(VideosController);
    service = module.get<VideosService>(VideosService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('uploadVideo', () => {
    it('should upload a video successfully', async () => {
      const mockFile = {
        originalname: 'test.mp4',
        mimetype: 'video/mp4',
        size: 1024 * 1024, // 1MB
        buffer: Buffer.from('fake video data'),
      } as Express.Multer.File;

      const createVideoDto = {
        title: 'Test Video',
        description: 'Test description',
      };

      const expectedResult = {
        id: 'video-id-123',
        title: 'Test Video',
        filename: 'test-file.mp4',
        status: 'PROCESSING',
      };

      mockVideosService.create.mockResolvedValue(expectedResult);

      const req = { user: { userId: 'user-123' } };
      const result = await controller.uploadVideo(
        mockFile,
        createVideoDto,
        req,
      );

      expect(service.create).toHaveBeenCalledWith(
        createVideoDto,
        mockFile,
        'user-123',
      );
      expect(result).toEqual(expectedResult);
    });

    it('should throw error when no file is provided', async () => {
      const createVideoDto = {
        title: 'Test Video',
        description: 'Test description',
      };

      const req = { user: { userId: 'user-123' } };

      await expect(
        controller.uploadVideo(undefined as any, createVideoDto, req),
      ).rejects.toThrow('Video file is required');
    });
  });

  describe('findAll', () => {
    it('should return paginated videos', async () => {
      const expectedResult = {
        videos: [
          {
            id: 'video-1',
            title: 'Video 1',
            status: 'READY',
          },
        ],
        pagination: {
          total: 1,
          page: 1,
          limit: 10,
          totalPages: 1,
        },
      };

      mockVideosService.findAll.mockResolvedValue(expectedResult);

      const result = await controller.findAll('1', '10');

      expect(service.findAll).toHaveBeenCalledWith(undefined, 1, 10);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('findMyVideos', () => {
    it('should return user videos', async () => {
      const expectedResult = {
        videos: [
          {
            id: 'video-1',
            title: 'My Video',
            status: 'READY',
          },
        ],
        pagination: {
          total: 1,
          page: 1,
          limit: 10,
          totalPages: 1,
        },
      };

      mockVideosService.findAll.mockResolvedValue(expectedResult);

      const req = { user: { userId: 'user-123' } };
      const result = await controller.findMyVideos(req, '1', '10');

      expect(service.findAll).toHaveBeenCalledWith('user-123', 1, 10);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('findOne', () => {
    it('should return a single video', async () => {
      const expectedResult = {
        id: 'video-1',
        title: 'Video 1',
        status: 'READY',
      };

      mockVideosService.findOne.mockResolvedValue(expectedResult);

      const result = await controller.findOne('video-1');

      expect(service.findOne).toHaveBeenCalledWith('video-1');
      expect(result).toEqual(expectedResult);
    });
  });

  describe('update', () => {
    it('should update a video', async () => {
      const updateDto = { title: 'Updated Title' };
      const expectedResult = {
        id: 'video-1',
        title: 'Updated Title',
        status: 'READY',
      };

      mockVideosService.update.mockResolvedValue(expectedResult);

      const req = { user: { userId: 'user-123' } };
      const result = await controller.update('video-1', updateDto, req);

      expect(service.update).toHaveBeenCalledWith(
        'video-1',
        updateDto,
        'user-123',
      );
      expect(result).toEqual(expectedResult);
    });
  });

  describe('remove', () => {
    it('should delete a video', async () => {
      const expectedResult = { message: 'Video deleted successfully' };

      mockVideosService.remove.mockResolvedValue(expectedResult);

      const req = { user: { userId: 'user-123' } };
      const result = await controller.remove('video-1', req);

      expect(service.remove).toHaveBeenCalledWith('video-1', 'user-123');
      expect(result).toEqual(expectedResult);
    });
  });

  describe('incrementView', () => {
    it('should increment video views', async () => {
      mockVideosService.incrementViews.mockResolvedValue(undefined);

      await controller.incrementView('video-1');

      expect(service.incrementViews).toHaveBeenCalledWith('video-1');
    });
  });
});
