import { IsEnum } from 'class-validator';
import { LikeType } from '@prisma/client';

export class LikeVideoDto {
  @IsEnum(LikeType)
  type: LikeType;
}
