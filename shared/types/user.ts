export interface User {
  id: string;
  email: string;
  username: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserProfile extends User {
  videosCount: number;
  subscribersCount: number;
  subscriptionsCount: number;
}

export interface UpdateUserDto {
  firstName?: string;
  lastName?: string;
  avatar?: string;
}