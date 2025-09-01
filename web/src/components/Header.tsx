'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { AuthModal } from '@/components/auth/AuthModal';
import { User, LogOut, Video, Search, Menu, Moon, Sun } from 'lucide-react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { cn } from '@/lib/utils';

interface HeaderProps {
  onMenuClick: () => void;
  isDarkMode?: boolean;
  onThemeToggle?: () => void;
}

export function Header({ onMenuClick, isDarkMode = true, onThemeToggle }: HeaderProps) {
  const { user, logout, isAuthenticated } = useAuth();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [searchQuery, setSearchQuery] = useState('');

  const openLoginModal = () => {
    setAuthMode('login');
    setAuthModalOpen(true);
  };

  const openRegisterModal = () => {
    setAuthMode('register');
    setAuthModalOpen(true);
  };

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-border bg-background">
        <div className="flex justify-between items-center h-16 px-4">
          {/* Left Section */}
          <div className="flex items-center space-x-4">
            {/* Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={onMenuClick}
            >
              <Menu className="h-6 w-6" />
            </Button>

            {/* Logo */}
            <Link href="/" className="flex items-center space-x-2 ml-4 md:ml-0">
              <Video className="h-8 w-8 text-primary" />
              <span className="text-xl font-bold hidden sm:block text-foreground">Duunoii</span>
            </Link>
          </div>

          {/* Search Bar */}
          <div className="flex-1 max-w-2xl mx-4">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search videos..."
                className="w-full px-4 py-2 pr-12 rounded-full border border-input bg-background text-foreground placeholder:text-muted-foreground focus:border-ring transition-colors"
              />
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8"
              >
                <Search className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Right Section */}
          <div className="flex items-center space-x-2">
            {/* Theme Toggle */}
            {onThemeToggle && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onThemeToggle}
              >
                {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </Button>
            )}

            {/* Auth Section */}
            {isAuthenticated && user ? (
              <>
                <Button 
                  variant="outline" 
                  size="sm"
                >
                  Upload Video
                </Button>
                
                <DropdownMenu.Root>
                  <DropdownMenu.Trigger asChild>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="flex items-center space-x-2"
                    >
                      <User className="h-4 w-4" />
                      <span className="hidden sm:inline">{user.displayName || user.username}</span>
                    </Button>
                  </DropdownMenu.Trigger>
                  
                  <DropdownMenu.Portal>
                    <DropdownMenu.Content 
                      className="rounded-md shadow-lg border border-border bg-popover p-2 w-48 z-50"
                      sideOffset={5}
                    >
                      <DropdownMenu.Item className="flex items-center space-x-2 px-3 py-2 text-sm rounded cursor-pointer text-foreground hover:bg-accent">
                        <User className="h-4 w-4" />
                        <span>Profile</span>
                      </DropdownMenu.Item>
                      
                      <DropdownMenu.Item className={cn(
                        'flex items-center space-x-2 px-3 py-2 text-sm rounded cursor-pointer',
                        isDarkMode 
                          ? 'text-white hover:bg-gray-700' 
                          : 'text-gray-900 hover:bg-gray-100'
                      )}>
                        <Video className="h-4 w-4" />
                        <span>My Videos</span>
                      </DropdownMenu.Item>
                      
                      <DropdownMenu.Separator className="h-px my-1 bg-border" />
                      
                      <DropdownMenu.Item 
                        className="flex items-center space-x-2 px-3 py-2 text-sm rounded cursor-pointer text-red-500 hover:bg-red-50"
                        onSelect={logout}
                      >
                        <LogOut className="h-4 w-4" />
                        <span>Sign Out</span>
                      </DropdownMenu.Item>
                    </DropdownMenu.Content>
                  </DropdownMenu.Portal>
                </DropdownMenu.Root>
              </>
            ) : (
              <div className="flex items-center space-x-2">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={openLoginModal}
                >
                  Sign In
                </Button>
                <Button 
                  size="sm" 
                  onClick={openRegisterModal}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Sign Up
                </Button>
              </div>
            )}
          </div>
        </div>
      </header>

      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        defaultMode={authMode}
      />
    </>
  );
}