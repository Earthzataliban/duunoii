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
      <header className={cn(
        'sticky top-0 z-30 border-b',
        isDarkMode 
          ? 'bg-gray-900 border-gray-800 text-white' 
          : 'bg-white border-gray-200 text-gray-900'
      )}>
        <div className="flex justify-between items-center h-16 px-4">
          {/* Left Section */}
          <div className="flex items-center space-x-4">
            {/* Menu Button */}
            <button
              onClick={onMenuClick}
              className={cn(
                'p-2 rounded-lg transition-colors md:hidden',
                isDarkMode 
                  ? 'hover:bg-gray-800' 
                  : 'hover:bg-gray-100'
              )}
            >
              <Menu className="h-6 w-6" />
            </button>

            {/* Logo */}
            <Link href="/" className="flex items-center space-x-2 ml-4 md:ml-0">
              <Video className="h-8 w-8 text-blue-500" />
              <span className="text-xl font-bold hidden sm:block">Duunoii</span>
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
                className={cn(
                  'w-full px-4 py-2 pr-12 rounded-full border transition-colors',
                  isDarkMode
                    ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:border-gray-500'
                    : 'bg-gray-100 border-gray-300 text-gray-900 placeholder-gray-500 focus:border-gray-500'
                )}
              />
              <button className={cn(
                'absolute right-1 top-1/2 transform -translate-y-1/2 p-2 rounded-full transition-colors',
                isDarkMode 
                  ? 'hover:bg-gray-700' 
                  : 'hover:bg-gray-200'
              )}>
                <Search className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Right Section */}
          <div className="flex items-center space-x-2">
            {/* Theme Toggle */}
            {onThemeToggle && (
              <button
                onClick={onThemeToggle}
                className={cn(
                  'p-2 rounded-lg transition-colors',
                  isDarkMode 
                    ? 'hover:bg-gray-800' 
                    : 'hover:bg-gray-100'
                )}
              >
                {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </button>
            )}

            {/* Auth Section */}
            {isAuthenticated && user ? (
              <>
                <Button 
                  variant="outline" 
                  size="sm"
                  className={cn(
                    isDarkMode 
                      ? 'border-gray-700 text-white hover:bg-gray-800' 
                      : 'border-gray-300 text-gray-900 hover:bg-gray-100'
                  )}
                >
                  Upload Video
                </Button>
                
                <DropdownMenu.Root>
                  <DropdownMenu.Trigger asChild>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className={cn(
                        'flex items-center space-x-2',
                        isDarkMode 
                          ? 'text-white hover:bg-gray-800' 
                          : 'text-gray-900 hover:bg-gray-100'
                      )}
                    >
                      <User className="h-4 w-4" />
                      <span className="hidden sm:inline">{user.displayName || user.username}</span>
                    </Button>
                  </DropdownMenu.Trigger>
                  
                  <DropdownMenu.Portal>
                    <DropdownMenu.Content 
                      className={cn(
                        'rounded-md shadow-lg border p-2 w-48 z-50',
                        isDarkMode 
                          ? 'bg-gray-800 border-gray-700' 
                          : 'bg-white border-gray-200'
                      )}
                      sideOffset={5}
                    >
                      <DropdownMenu.Item className={cn(
                        'flex items-center space-x-2 px-3 py-2 text-sm rounded cursor-pointer',
                        isDarkMode 
                          ? 'text-white hover:bg-gray-700' 
                          : 'text-gray-900 hover:bg-gray-100'
                      )}>
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
                      
                      <DropdownMenu.Separator className={cn(
                        'h-px my-1',
                        isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
                      )} />
                      
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
                  className={cn(
                    isDarkMode 
                      ? 'text-white hover:bg-gray-800' 
                      : 'text-gray-900 hover:bg-gray-100'
                  )}
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