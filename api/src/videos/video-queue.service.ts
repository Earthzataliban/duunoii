import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue, Process, Processor } from '@nestjs/bull';
import type { Job, Queue } from 'bull';
import { VideoProcessingService } from './video-processing.service';

export interface VideoProcessingJob {
  videoId: string;
  userId: string;
}

@Injectable()
@Processor('video-processing')
export class VideoQueueService {
  private readonly logger = new Logger(VideoQueueService.name);

  constructor(
    @InjectQueue('video-processing') private videoQueue: Queue,
    private videoProcessingService: VideoProcessingService,
  ) {}

  async addVideoProcessingJob(
    videoId: string,
    userId: string,
  ): Promise<Job<VideoProcessingJob>> {
    this.logger.log(`Adding video processing job for video ID: ${videoId}`);

    const job = await this.videoQueue.add(
      'process-video',
      { videoId, userId },
      {
        attempts: 3, // Retry up to 3 times on failure
        backoff: {
          type: 'exponential',
          delay: 2000, // Start with 2 second delay, then exponential backoff
        },
        removeOnComplete: 10, // Keep last 10 completed jobs for monitoring
        removeOnFail: 50, // Keep last 50 failed jobs for debugging
      },
    );

    this.logger.log(`Video processing job added with ID: ${job.id}`);
    return job;
  }

  @Process('process-video')
  async processVideo(job: Job<VideoProcessingJob>): Promise<void> {
    const { videoId } = job.data;

    this.logger.log(`Processing video job: ${job.id} for video: ${videoId}`);

    try {
      // Update job progress
      await job.progress(10);

      // Process the video
      await this.videoProcessingService.processVideo(videoId);

      // Mark job as completed
      await job.progress(100);

      this.logger.log(`Video processing job completed: ${job.id}`);
    } catch (error) {
      this.logger.error(`Video processing job failed: ${job.id}`, error.stack);
      throw error;
    }
  }

  async getJobStatus(jobId: string): Promise<{
    status: string;
    progress: number;
    data?: any;
    error?: any;
  }> {
    const job = await this.videoQueue.getJob(jobId);

    if (!job) {
      throw new Error(`Job with ID ${jobId} not found`);
    }

    const state = await job.getState();
    const progress = job.progress();

    return {
      status: state,
      progress: typeof progress === 'number' ? progress : 0,
      data: job.data,
      error: job.failedReason,
    };
  }

  async getQueueStats(): Promise<{
    waiting: number;
    active: number;
    completed: number;
    failed: number;
  }> {
    const [waiting, active, completed, failed] = await Promise.all([
      this.videoQueue.getWaiting(),
      this.videoQueue.getActive(),
      this.videoQueue.getCompleted(),
      this.videoQueue.getFailed(),
    ]);

    return {
      waiting: waiting.length,
      active: active.length,
      completed: completed.length,
      failed: failed.length,
    };
  }

  async retryFailedJobs(): Promise<number> {
    const failedJobs = await this.videoQueue.getFailed();
    let retriedCount = 0;

    for (const job of failedJobs) {
      try {
        await job.retry();
        retriedCount++;
      } catch (error) {
        this.logger.error(`Failed to retry job ${job.id}:`, error);
      }
    }

    this.logger.log(`Retried ${retriedCount} failed jobs`);
    return retriedCount;
  }

  async cleanCompletedJobs(olderThanDays = 7): Promise<number> {
    const olderThan = Date.now() - olderThanDays * 24 * 60 * 60 * 1000;

    const completedJobs = await this.videoQueue.getCompleted();
    let cleanedCount = 0;

    for (const job of completedJobs) {
      if (job.timestamp && job.timestamp < olderThan) {
        try {
          await job.remove();
          cleanedCount++;
        } catch (error) {
          this.logger.error(`Failed to clean job ${job.id}:`, error);
        }
      }
    }

    this.logger.log(`Cleaned ${cleanedCount} old completed jobs`);
    return cleanedCount;
  }
}
