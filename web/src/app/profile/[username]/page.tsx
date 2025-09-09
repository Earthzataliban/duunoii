'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { VideoGrid } from '@/components/VideoGrid';
import { Calendar, Eye, Video, Users } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';

interface User {
  id: string;
  username: string;
  displayName?: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
  createdAt: string;
  email: string;
}

interface UserStats {
  videoCount: number;
  totalViews: number;
  subscriberCount: number;
}

export default function ProfilePage() {
  const params = useParams();
  const username = params?.username as string;
  const { user: currentUser } = useAuth();
  
  const [profileUser, setProfileUser] = useState<User | null>(null);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubscribed, setIsSubscribed] = useState(false);

  useEffect(() => {
    if (!username) return;

    const fetchUserProfile = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch user profile
        const profileResponse = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/users/profile/${username}`
        );

        if (!profileResponse.ok) {
          if (profileResponse.status === 404) {
            setError('User not found');
          } else {
            setError('Failed to load user profile');
          }
          return;
        }

        const userData = await profileResponse.json();
        setProfileUser(userData);

        // Fetch user stats
        const statsResponse = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/users/${userData.id}/stats`
        );

        if (statsResponse.ok) {
          const statsData = await statsResponse.json();
          setUserStats(statsData);
        }

        // Check subscription status if current user is logged in
        if (currentUser && currentUser.id !== userData.id) {
          const subResponse = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/users/${userData.id}/subscription-status`,
            {
              headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
              }
            }
          );
          
          if (subResponse.ok) {
            const subData = await subResponse.json();
            setIsSubscribed(subData.isSubscribed);
          }
        }

      } catch (err) {
        console.error('Error fetching user profile:', err);
        setError('Failed to load user profile');
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [username, currentUser]);

  const handleSubscribe = async () => {
    if (!currentUser || !profileUser) return;

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/users/${profileUser.id}/subscribe`,
        {
          method: isSubscribed ? 'DELETE' : 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.ok) {
        setIsSubscribed(!isSubscribed);
        // Update subscriber count
        if (userStats) {
          setUserStats({
            ...userStats,
            subscriberCount: userStats.subscriberCount + (isSubscribed ? -1 : 1)
          });
        }
      }
    } catch (err) {
      console.error('Error toggling subscription:', err);
    }
  };

  const getUserInitials = (user: User) => {
    if (user.displayName) {
      return user.displayName.split(' ').map(name => name[0]).join('').toUpperCase().slice(0, 2);
    }
    return user.username.slice(0, 2).toUpperCase();
  };

  const getDisplayName = (user: User) => {
    if (user.displayName) return user.displayName;
    if (user.firstName && user.lastName) return `${user.firstName} ${user.lastName}`;
    return user.username;
  };

  const formatJoinDate = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch {
      return 'Unknown';
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="animate-pulse space-y-6">
          <div className="flex items-start gap-6">
            <div className="w-32 h-32 bg-muted rounded-full" />
            <div className="flex-1 space-y-4">
              <div className="h-8 bg-muted rounded w-1/3" />
              <div className="h-4 bg-muted rounded w-1/4" />
              <div className="flex gap-4">
                <div className="h-4 bg-muted rounded w-20" />
                <div className="h-4 bg-muted rounded w-20" />
                <div className="h-4 bg-muted rounded w-20" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !profileUser) {
    return (
      <div className="max-w-6xl mx-auto p-6 text-center">
        <h1 className="text-2xl font-bold text-foreground mb-4">
          {error || 'User Not Found'}
        </h1>
        <p className="text-muted-foreground mb-6">
          {error === 'User not found' 
            ? 'The user profile you\'re looking for doesn\'t exist.' 
            : 'There was an error loading this user profile.'}
        </p>
        <Link href="/">
          <Button variant="outline">Back to Home</Button>
        </Link>
      </div>
    );
  }

  const isOwnProfile = currentUser?.id === profileUser.id;

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      {/* User Profile Header */}
      <div className="bg-card rounded-lg p-6 border">
        <div className="flex flex-col sm:flex-row items-start gap-6">
          {/* Avatar */}
          <Avatar className="w-32 h-32">
            <AvatarImage src={profileUser.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${profileUser.username}`} />
            <AvatarFallback className="text-2xl">
              {getUserInitials(profileUser)}
            </AvatarFallback>
          </Avatar>

          {/* User Info */}
          <div className="flex-1 space-y-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                {getDisplayName(profileUser)}
              </h1>
              <p className="text-muted-foreground">@{profileUser.username}</p>
            </div>

            {/* Stats */}
            <div className="flex flex-wrap gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Video size={16} />
                <span>{userStats?.videoCount || 0} videos</span>
              </div>
              <div className="flex items-center gap-2">
                <Eye size={16} />
                <span>{userStats?.totalViews?.toLocaleString() || 0} total views</span>
              </div>
              <div className="flex items-center gap-2">
                <Users size={16} />
                <span>{userStats?.subscriberCount || 0} subscribers</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar size={16} />
                <span>Joined {formatJoinDate(profileUser.createdAt)}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              {isOwnProfile ? (
                <Link href="/dashboard">
                  <Button>Manage Videos</Button>
                </Link>
              ) : currentUser ? (
                <Button 
                  onClick={handleSubscribe}
                  variant={isSubscribed ? "outline" : "default"}
                >
                  {isSubscribed ? 'Subscribed' : 'Subscribe'}
                </Button>
              ) : (
                <Link href="/?auth=login">
                  <Button>Subscribe</Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* User's Videos */}
      <VideoGrid
        title={isOwnProfile ? "Your Videos" : `${getDisplayName(profileUser)}'s Videos`}
        userId={profileUser.id}
        limit={12}
        className="space-y-6"
      />
    </div>
  );
}