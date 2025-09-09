import { IsString } from 'class-validator';

export class AddVideoToPlaylistDto {
  @IsString()
  videoId: string;
}
