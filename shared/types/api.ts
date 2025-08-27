export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T = any> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface ApiError {
  statusCode: number;
  message: string;
  error: string;
  timestamp: string;
  path: string;
}

export interface UploadResponse {
  id: string;
  filename: string;
  originalName: string;
  size: number;
  mimeType: string;
  url: string;
}