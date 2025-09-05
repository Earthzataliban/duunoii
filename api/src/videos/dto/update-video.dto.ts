import { PartialType } from '@nestjs/mapped-types';
import { IsEnum, IsOptional } from 'class-validator';
import { CreateVideoDto } from './create-video.dto';

enum VideoPrivacy {
  PUBLIC = 'PUBLIC',
  UNLISTED = 'UNLISTED',
  PRIVATE = 'PRIVATE'
}

export class UpdateVideoDto extends PartialType(CreateVideoDto) {
  @IsEnum(VideoPrivacy)
  @IsOptional()
  privacy?: VideoPrivacy;
}
