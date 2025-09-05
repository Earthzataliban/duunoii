import {
  IsString,
  IsOptional,
  IsNotEmpty,
  MaxLength,
  IsEnum,
} from 'class-validator';

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

export class CreateVideoDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title: string;

  @IsString()
  @IsOptional()
  @MaxLength(5000)
  description?: string;

  @IsEnum(VideoCategory)
  @IsOptional()
  category?: VideoCategory;
}
