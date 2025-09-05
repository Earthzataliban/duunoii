'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Upload, SlidersHorizontal } from 'lucide-react';
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

const sortOptions = [
  { value: 'newest', label: 'Newest' },
  { value: 'oldest', label: 'Oldest' },
  { value: 'most_viewed', label: 'Most Viewed' },
  { value: 'least_viewed', label: 'Least Viewed' }
];


export default function Home() {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortBy, setSortBy] = useState('newest');
  const [showFilters, setShowFilters] = useState(false);
  const { isAuthenticated } = useAuth();
  const searchParams = useSearchParams();
  
  // Get search query from URL params (from header search)
  const searchQuery = searchParams.get('search') || '';

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

      {/* Filters and Categories */}
      <div className="space-y-4">
        {/* Filters Button */}
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-foreground">Browse Categories</h2>
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2"
          >
            <SlidersHorizontal className="h-4 w-4" />
            Filters
          </Button>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="bg-muted/50 p-4 rounded-lg space-y-4">
            {/* Sort Options */}
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">Sort by</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground"
              >
                {sortOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Browse Categories */}
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
        title={searchQuery ? `Search results for "${searchQuery}"` : selectedCategory === 'All' ? 'Latest Videos' : `${selectedCategory} Videos`}
        limit={16}
        category={selectedCategory !== 'All' ? selectedCategory : undefined}
        search={searchQuery || undefined}
        sortBy={sortBy}
        className="space-y-6"
      />
    </div>
  );
}

