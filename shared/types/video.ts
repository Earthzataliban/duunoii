export enum VideoStatus {
  PROCESSING = 'PROCESSING',
  READY = 'READY',
  FAILED = 'FAILED',
}

export enum LikeType {
  LIKE = 'LIKE',
  DISLIKE = 'DISLIKE',
}

export interface Video {
  id: string;
  title: string;
  description?: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  duration?: number;
  status: VideoStatus;
  thumbnailUrl?: string;
  views: number;
  uploaderId: string;
  createdAt: Date;
  updatedAt: Date;
  uploader?: {
    id: string;
    username: string;
    avatar?: string;
  };
  videoFiles?: VideoFile[];
  _count?: {
    likes: number;
    comments: number;
  };
}

export interface VideoFile {
  id: string;
  videoId: string;
  resolution: string;
  filePath: string;
  fileSize: number;
  bitrate?: number;
  createdAt: Date;
}

export interface Comment {
  id: string;
  content: string;
  videoId: string;
  userId: string;
  parentId?: string;
  createdAt: Date;
  updatedAt: Date;
  user: {
    id: string;
    username: string;
    avatar?: string;
  };
  replies?: Comment[];
}

export interface Like {
  id: string;
  videoId: string;
  userId: string;
  type: LikeType;
  createdAt: Date;
}

export interface CreateVideoDto {
  title: string;
  description?: string;
}

export interface UpdateVideoDto {
  title?: string;
  description?: string;
}

export interface CreateCommentDto {
  content: string;
  parentId?: string;
}

export interface VideoSearchQuery {
  q?: string;
  category?: string;
  sortBy?: 'createdAt' | 'views' | 'title';
  order?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface VideoUploadResponse {
  id: string;
  title: string;
  filename: string;
  originalName: string;
  size: number;
  status: VideoStatus;
  uploaderId: string;
  createdAt: Date;
}

export interface UploadProgressEvent {
  videoId: string;
  stage: 'upload' | 'processing' | 'complete' | 'error';
  progress: number; // 0-100
  message?: string;
}