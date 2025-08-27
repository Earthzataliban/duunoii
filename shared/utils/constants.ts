export const VIDEO_RESOLUTIONS = ['360p', '720p', '1080p', '4K'] as const;

export const SUPPORTED_VIDEO_FORMATS = [
  'video/mp4',
  'video/avi',
  'video/mov',
  'video/wmv',
  'video/flv',
  'video/webm',
  'video/mkv'
] as const;

export const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

export const PAGINATION_LIMITS = {
  DEFAULT: 10,
  MAX: 50,
} as const;

export const VIDEO_PROCESSING_TIMEOUTS = {
  UPLOAD: 5 * 60 * 1000, // 5 minutes
  TRANSCODE: 30 * 60 * 1000, // 30 minutes
} as const;

export const API_ROUTES = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    REFRESH: '/auth/refresh',
    LOGOUT: '/auth/logout',
    PROFILE: '/auth/profile',
  },
  VIDEOS: {
    LIST: '/videos',
    UPLOAD: '/videos/upload',
    MY_VIDEOS: '/videos/my-videos',
    DETAIL: (id: string) => `/videos/${id}`,
    UPDATE: (id: string) => `/videos/${id}`,
    DELETE: (id: string) => `/videos/${id}`,
    VIEW: (id: string) => `/videos/${id}/view`,
    STREAM: (id: string) => `/videos/${id}/stream`,
    THUMBNAIL: (id: string) => `/videos/${id}/thumbnail`,
    COMMENTS: (id: string) => `/videos/${id}/comments`,
    LIKE: (id: string) => `/videos/${id}/like`,
  },
  USERS: {
    PROFILE: (id: string) => `/users/${id}`,
    VIDEOS: (id: string) => `/users/${id}/videos`,
    SUBSCRIBE: (id: string) => `/users/${id}/subscribe`,
  },
} as const;