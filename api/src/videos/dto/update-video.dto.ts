import { PartialType } from '@nestjs/mapped-types';
import { IsEnum, IsOptional } from 'class-validator';
import { CreateVideoDto } from './create-video.dto';

enum VideoPrivacy {
  PUBLIC = 'PUBLIC',
  UNLISTED = 'UNLISTED',
  PRIVATE = 'PRIVATE',
}

enum VideoCategory {
  Technology = 'Technology',
  Music = 'Music',
  Cooking = 'Cooking',
  Fitness = 'Fitness',
  Travel = 'Travel',
  Business = 'Business',
  Gaming = 'Gaming',
  Education = 'Education',
  Other = 'Other',
}

export class UpdateVideoDto extends PartialType(CreateVideoDto) {
  @IsEnum(VideoPrivacy)
  @IsOptional()
  privacy?: VideoPrivacy;

  @IsEnum(VideoCategory)
  @IsOptional()
  category?: VideoCategory;
}
