import { Test, TestingModule } from '@nestjs/testing';
import { VideosService } from './videos.service';
import { VideoQueueService } from './video-queue.service';
import { PrismaService } from '../prisma/prisma.service';

describe('VideosService', () => {
  let service: VideosService;

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

  const mockVideoQueueService = {
    addVideoProcessingJob: jest.fn(),
    getQueueStats: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VideosService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: VideoQueueService,
          useValue: mockVideoQueueService,
        },
      ],
    }).compile();

    service = module.get<VideosService>(VideosService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
