'use client';

import { useState } from 'react';
import { Play, TrendingUp, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';

const categories = [
  'All',
  'Technology',
  'Music',
  'Cooking',
  'Fitness',
  'Travel',
  'Business',
  'Gaming',
  'Education'
];

const mockVideos = [
  {
    id: '1',
    title: 'Complete React Tutorial 2024: Build Modern Web Applications',
    channel: 'TechEducator',
    views: '890K',
    uploadTime: 'about 1 year ago',
    duration: '45:32',
    thumbnail: '/api/placeholder/480/270',
    avatar: '/api/placeholder/40/40'
  },
  {
    id: '2',
    title: 'JavaScript ES2024: New Features You Need to Know',
    channel: 'CodeAcademy',
    views: '234K',
    uploadTime: 'about 1 year ago',
    duration: '22:18',
    thumbnail: '/api/placeholder/480/270',
    avatar: '/api/placeholder/40/40'
  },
  {
    id: '3',
    title: 'Epic Classical Piano Performance: Chopin\'s Greatest Hits',
    channel: 'MusicMasters',
    views: '567K',
    uploadTime: 'about 1 year ago',
    duration: '35:22',
    thumbnail: '/api/placeholder/480/270',
    avatar: '/api/placeholder/40/40'
  },
  {
    id: '4',
    title: 'Modern Web Design Principles: CSS Grid and Flexbox',
    channel: 'DesignAcademy',
    views: '432K',
    uploadTime: 'about 8 months ago',
    duration: '28:15',
    thumbnail: '/api/placeholder/480/270',
    avatar: '/api/placeholder/40/40'
  },
  {
    id: '5',
    title: 'Advanced TypeScript Patterns for Large Applications',
    channel: 'CodeMasters',
    views: '321K',
    uploadTime: 'about 6 months ago',
    duration: '42:08',
    thumbnail: '/api/placeholder/480/270',
    avatar: '/api/placeholder/40/40'
  },
  // Add more mock videos...
];

export default function Home() {
  const [selectedCategory, setSelectedCategory] = useState('All');

  return (
    <div className="p-6 space-y-8 min-h-screen">
      {/* Featured Video Section */}
      <div className="relative rounded-xl overflow-hidden bg-gradient-to-r from-purple-900 to-blue-900">
        <div className="absolute inset-0 bg-black/40"></div>
        <div className="relative z-10 p-8 md:p-12 flex flex-col md:flex-row items-start md:items-center">
          <div className="flex-1 mb-6 md:mb-0 md:pr-8">
            <div className="flex items-center mb-4">
              <span className="bg-red-600 text-white px-2 py-1 text-xs font-semibold rounded mr-2">
                Featured
              </span>
              <span className="bg-gray-800 text-white px-2 py-1 text-xs rounded">
                Technology
              </span>
            </div>

            <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
              The Future of Web Development: React 19 and Beyond
            </h1>

            <p className="text-gray-200 text-lg mb-6 max-w-2xl">
              Discover the latest features in React 19 and explore what the future holds for web development. From server components to concurrent...
            </p>

            <div className="flex items-center text-white mb-6">
              <div className="w-8 h-8 bg-gray-400 rounded-full mr-3"></div>
              <span className="mr-4">TechEducator</span>
              <span className="mr-4">1.3M views</span>
              <span>12 months ago</span>
            </div>

            <div className="flex items-center space-x-4">
              <button className="bg-white text-black px-6 py-2 rounded-full font-semibold flex items-center space-x-2 hover:bg-gray-100 transition-colors">
                <Play className="h-4 w-4" />
                <span>Watch Now</span>
              </button>
              <div className="flex items-center text-white">
                <Clock className="h-4 w-4 mr-1" />
                <span>28:45</span>
              </div>
            </div>
          </div>

          {/* Featured video thumbnail */}
          <div className="w-full md:w-96 aspect-video bg-gray-800 rounded-lg overflow-hidden">
            <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
              <Play className="h-12 w-12 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Browse Categories */}
      <div>
        <h2 className="text-xl font-semibold text-foreground mb-4">Browse Categories</h2>
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <Button
              key={category}
              onClick={() => setSelectedCategory(category)}
              variant={selectedCategory === category ? "default" : "secondary"}
              size="sm"
              className="rounded-full"
            >
              {category}
            </Button>
          ))}
        </div>
      </div>

      {/* Trending Now */}
      <div>
        <div className="flex items-center mb-6">
          <TrendingUp className="h-5 w-5 text-red-500 mr-2" />
          <h2 className="text-xl font-semibold text-foreground">Trending Now</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
          {mockVideos.slice(0, 4).map((video) => (
            <VideoCard key={video.id} video={video} />
          ))}
        </div>
      </div>

      {/* Recently Added */}
      <div>
        <div className="flex items-center mb-6">
          <Clock className="h-5 w-5 text-blue-500 mr-2" />
          <h2 className="text-xl font-semibold text-foreground">Recently Added</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
          {mockVideos.map((video) => (
            <VideoCard key={video.id} video={video} />
          ))}
        </div>
      </div>

      {/* Pagination */}
      <div className="flex justify-center items-center space-x-4 pt-8">
        <Button variant="ghost" size="sm">
          Previous
        </Button>
        <div className="flex space-x-2">
          <Button variant="default" size="icon" className="w-8 h-8">1</Button>
          <Button variant="secondary" size="icon" className="w-8 h-8">2</Button>
          <Button variant="secondary" size="icon" className="w-8 h-8">3</Button>
        </div>
        <Button variant="ghost" size="sm">
          Next
        </Button>
      </div>
    </div>
  );
}

function VideoCard({ video }: { video: Record<string, unknown> }) {
  return (
    <div className="group cursor-pointer">
      {/* Thumbnail */}
      <div className="relative aspect-video bg-muted rounded-lg overflow-hidden mb-3">
        <div className="absolute inset-0 bg-gradient-to-br from-muted to-muted/80 flex items-center justify-center">
          <Play className="h-8 w-8 text-muted-foreground group-hover:scale-110 transition-transform" />
        </div>

        {/* Duration */}
        <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded">
          {String(video.duration)}
        </div>
      </div>

      {/* Video Info */}
      <div className="flex space-x-3">
        {/* Channel Avatar */}
        <div className="w-9 h-9 bg-muted rounded-full flex-shrink-0 mt-1"></div>

        {/* Video Details */}
        <div className="flex-1 min-w-0">
          <h3 className="text-foreground font-medium text-sm leading-5 line-clamp-2 mb-1 group-hover:text-muted-foreground transition-colors">
            {String(video.title)}
          </h3>

          <p className="text-muted-foreground text-sm mb-1">
            {String(video.channel)}
          </p>

          <p className="text-muted-foreground text-sm">
            {String(video.views)} views • {String(video.uploadTime)}
          </p>
        </div>
      </div>
    </div>
  );
}
