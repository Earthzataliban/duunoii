'use client';

// import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { 
  Home, 
  Play, 
  Users, 
  BookOpen, 
  History, 
  Clock, 
  ThumbsUp,
  X,
  Upload
} from 'lucide-react';

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

const mainNavItems = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/watch', label: 'Watch', icon: Play },
  { href: '/subscriptions', label: 'Subscriptions', icon: Users },
  { href: '/upload', label: 'Upload', icon: Upload },
];

const libraryItems = [
  { href: '/library', label: 'Library', icon: BookOpen },
  { href: '/history', label: 'History', icon: History },
  { href: '/watch-later', label: 'Watch later', icon: Clock },
  { href: '/liked', label: 'Liked videos', icon: ThumbsUp },
];

// Categories will be implemented in Phase 4
// const categories = [
//   { href: '/category/music', label: 'Music', icon: Music },
//   { href: '/category/gaming', label: 'Gaming', icon: Gamepad2 },
//   { href: '/category/education', label: 'Education', icon: GraduationCap },
//   { href: '/category/business', label: 'Business', icon: Briefcase },
//   { href: '/category/travel', label: 'Travel', icon: MapPin },
//   { href: '/category/cooking', label: 'Cooking', icon: ChefHat },
//   { href: '/category/fitness', label: 'Fitness', icon: Dumbbell },
// ];

export function Sidebar({ isCollapsed, onToggle }: SidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {/* Mobile Overlay */}
      {!isCollapsed && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={cn(
          'fixed left-0 top-0 h-full bg-gray-900 text-white z-50 transition-transform duration-300 overflow-y-auto',
          'md:static md:z-auto',
          isCollapsed ? '-translate-x-full md:translate-x-0 md:w-16' : 'w-64 md:w-64'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-800 md:hidden">
          <button
            onClick={onToggle}
            className="p-1 hover:bg-gray-800 rounded"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="p-2">
          {/* Main Navigation */}
          <div className="mb-6">
            {mainNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors',
                    isActive 
                      ? 'bg-gray-800 text-white' 
                      : 'text-gray-300 hover:bg-gray-800 hover:text-white',
                    isCollapsed && 'justify-center space-x-0'
                  )}
                >
                  <Icon className="h-5 w-5 flex-shrink-0" />
                  {!isCollapsed && <span>{item.label}</span>}
                </Link>
              );
            })}
          </div>

          {!isCollapsed && (
            <>
              {/* Library Section */}
              <div className="mb-6">
                <h3 className="text-gray-400 text-sm font-semibold px-3 mb-2 uppercase tracking-wide">
                  Library
                </h3>
                {libraryItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        'flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors',
                        isActive 
                          ? 'bg-gray-800 text-white' 
                          : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                      )}
                    >
                      <Icon className="h-5 w-5 flex-shrink-0" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>

            </>
          )}
        </nav>
      </aside>
    </>
  );
}