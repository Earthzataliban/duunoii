'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { AuthModal } from '@/components/auth/AuthModal';
import { User, LogOut, Video } from 'lucide-react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';

export function Header() {
  const { user, logout, isAuthenticated } = useAuth();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

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
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center space-x-2">
              <Video className="h-8 w-8 text-blue-600" />
              <h1 className="text-xl font-bold text-gray-900">Duunoii</h1>
            </div>

            {/* Navigation */}
            <nav className="hidden md:flex items-center space-x-8">
              <Link href="/" className="text-gray-700 hover:text-gray-900">Home</Link>
              <Link href="/explore" className="text-gray-700 hover:text-gray-900">Explore</Link>
              <Link href="/trending" className="text-gray-700 hover:text-gray-900">Trending</Link>
            </nav>

            {/* Auth Section */}
            <div className="flex items-center space-x-4">
              {isAuthenticated && user ? (
                <>
                  <Button variant="outline" size="sm">
                    Upload Video
                  </Button>
                  
                  <DropdownMenu.Root>
                    <DropdownMenu.Trigger asChild>
                      <Button variant="ghost" size="sm" className="flex items-center space-x-2">
                        <User className="h-4 w-4" />
                        <span>{user.displayName || user.username}</span>
                      </Button>
                    </DropdownMenu.Trigger>
                    
                    <DropdownMenu.Portal>
                      <DropdownMenu.Content 
                        className="bg-white rounded-md shadow-lg border p-2 w-48"
                        sideOffset={5}
                      >
                        <DropdownMenu.Item className="flex items-center space-x-2 px-3 py-2 text-sm rounded hover:bg-gray-100 cursor-pointer">
                          <User className="h-4 w-4" />
                          <span>Profile</span>
                        </DropdownMenu.Item>
                        
                        <DropdownMenu.Item className="flex items-center space-x-2 px-3 py-2 text-sm rounded hover:bg-gray-100 cursor-pointer">
                          <Video className="h-4 w-4" />
                          <span>My Videos</span>
                        </DropdownMenu.Item>
                        
                        <DropdownMenu.Separator className="h-px bg-gray-200 my-1" />
                        
                        <DropdownMenu.Item 
                          className="flex items-center space-x-2 px-3 py-2 text-sm rounded hover:bg-gray-100 cursor-pointer text-red-600"
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
                  <Button variant="ghost" size="sm" onClick={openLoginModal}>
                    Sign In
                  </Button>
                  <Button size="sm" onClick={openRegisterModal}>
                    Sign Up
                  </Button>
                </div>
              )}
            </div>
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