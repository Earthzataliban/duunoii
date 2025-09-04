'use client';

import { useState } from 'react';
import { Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { VideoGrid } from '@/components/VideoGrid';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';

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


export default function Home() {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const { isAuthenticated } = useAuth();

  return (
    <div className="p-6 space-y-8 min-h-screen max-w-7xl mx-auto">
      {/* Header with Upload CTA */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Discover Videos</h1>
          <p className="text-muted-foreground">Watch and share videos from creators around the world</p>
        </div>
        
        {isAuthenticated && (
          <Link href="/upload">
            <Button className="bg-primary hover:bg-primary/90">
              <Upload className="h-4 w-4 mr-2" />
              Upload Video
            </Button>
          </Link>
        )}
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

      {/* Video Grid - Real Data */}
      <VideoGrid 
        title="Latest Videos"
        limit={16}
        className="space-y-6"
      />
    </div>
  );
}

