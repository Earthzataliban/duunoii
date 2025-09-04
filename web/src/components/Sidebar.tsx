'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Home,
  Play,
  Users,
  BookOpen,
  History,
  Clock,
  ThumbsUp,
  X,
  Upload,
  BarChart3
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
  { href: '/dashboard', label: 'Dashboard', icon: BarChart3 },
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
          'fixed left-0 top-0 h-screen bg-sidebar text-sidebar-foreground border-r border-sidebar-border z-50 transition-transform duration-300 overflow-y-auto',
          'md:static md:z-auto md:h-full',
          isCollapsed ? '-translate-x-full md:translate-x-0 md:w-16' : 'w-64 md:w-full'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-sidebar-border md:hidden">
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggle}
          >
            <X className="h-6 w-6" />
          </Button>
        </div>

        {/* Navigation */}
        <nav className="p-3 space-y-1">
          {/* Main Navigation */}
          <div className="mb-6">
            {mainNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <Button
                  key={item.href}
                  variant={isActive ? "secondary" : "ghost"}
                  size="default"
                  className={cn(
                    'w-full justify-start h-10 px-3',
                    isCollapsed && 'w-10 px-0 justify-center'
                  )}
                  asChild
                >
                  <Link href={item.href}>
                    <Icon className="h-5 w-5 flex-shrink-0" />
                    {!isCollapsed && <span className="ml-3">{item.label}</span>}
                  </Link>
                </Button>
              );
            })}
          </div>

          {!isCollapsed && (
            <>
              {/* Library Section */}
              <div className="mb-6">
                <h3 className="text-muted-foreground text-sm font-semibold px-3 mb-2 uppercase tracking-wide">
                  Library
                </h3>
                {libraryItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;

                  return (
                    <Button
                      key={item.href}
                      variant={isActive ? "secondary" : "ghost"}
                      size="default"
                      className="w-full justify-start h-10 px-3"
                      asChild
                    >
                      <Link href={item.href}>
                        <Icon className="h-5 w-5 flex-shrink-0" />
                        <span className="ml-3">{item.label}</span>
                      </Link>
                    </Button>
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
