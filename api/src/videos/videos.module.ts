import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { VideosService } from './videos.service';
import { VideosController } from './videos.controller';
import { VideoProcessingService } from './video-processing.service';
import { VideoQueueService } from './video-queue.service';
import { HLSService } from './hls.service';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'video-processing',
    }),
  ],
  providers: [
    VideosService,
    VideoProcessingService,
    VideoQueueService,
    HLSService,
  ],
  controllers: [VideosController],
  exports: [
    VideosService,
    VideoProcessingService,
    VideoQueueService,
    HLSService,
  ],
})
export class VideosModule {}
