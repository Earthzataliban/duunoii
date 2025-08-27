'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { AuthModal } from '@/components/auth/AuthModal';
import { Video, Play, TrendingUp, Users } from 'lucide-react';

export default function Home() {
  const { user, isAuthenticated } = useAuth();
  const [authModalOpen, setAuthModalOpen] = useState(false);

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Hero Section */}
      <div className="text-center py-20 bg-gradient-to-b from-blue-50 to-white rounded-lg mb-12">
        <h1 className="text-5xl font-bold text-gray-900 mb-6">
          Welcome to <span className="text-blue-600">Duunoii</span>
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          The budget-friendly video platform where everyone can share, discover, and connect through video content.
        </p>
        
        {!isAuthenticated ? (
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              onClick={() => setAuthModalOpen(true)}
              className="px-8 py-3 text-lg"
            >
              Get Started Free
            </Button>
            <Button 
              variant="outline" 
              size="lg"
              className="px-8 py-3 text-lg"
            >
              Learn More
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold text-gray-700">
              Welcome back, {user?.displayName || user?.username}!
            </h2>
            <Button size="lg" className="px-8 py-3 text-lg">
              <Video className="h-5 w-5 mr-2" />
              Upload Your First Video
            </Button>
          </div>
        )}
      </div>

      {/* Features Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
        <div className="text-center p-6 bg-white rounded-lg shadow-sm border">
          <Video className="h-12 w-12 text-blue-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-3">Easy Upload</h3>
          <p className="text-gray-600">
            Upload and share your videos with just a few clicks. Support for multiple formats and resolutions.
          </p>
        </div>

        <div className="text-center p-6 bg-white rounded-lg shadow-sm border">
          <TrendingUp className="h-12 w-12 text-green-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-3">Discover Content</h3>
          <p className="text-gray-600">
            Explore trending videos and discover new creators. Personalized recommendations just for you.
          </p>
        </div>

        <div className="text-center p-6 bg-white rounded-lg shadow-sm border">
          <Users className="h-12 w-12 text-purple-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-3">Build Community</h3>
          <p className="text-gray-600">
            Connect with creators and viewers. Like, comment, and build your own audience.
          </p>
        </div>
      </div>

      {/* Recent Videos Section (Placeholder) */}
      <div className="mb-12">
        <h2 className="text-3xl font-bold text-gray-900 mb-8">Trending Videos</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((item) => (
            <div key={item} className="bg-white rounded-lg shadow-sm border overflow-hidden">
              <div className="aspect-video bg-gray-100 flex items-center justify-center">
                <Play className="h-12 w-12 text-gray-400" />
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-gray-900 mb-2">Sample Video Title</h3>
                <p className="text-sm text-gray-600 mb-2">Creator Name</p>
                <p className="text-xs text-gray-500">1.2K views • 2 days ago</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        defaultMode="register"
      />
    </div>
  );
}
