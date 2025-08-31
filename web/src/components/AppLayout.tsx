'use client';

import { useState, useEffect } from 'react';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { cn } from '@/lib/utils';

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);

  // Load theme preference from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      setIsDarkMode(savedTheme === 'dark');
    }
  }, []);

  // Save theme preference to localStorage
  useEffect(() => {
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  return (
    <div className={cn(
      'min-h-screen transition-colors',
      isDarkMode ? 'bg-gray-950 text-white' : 'bg-gray-50 text-gray-900'
    )}>
      <Header 
        onMenuClick={toggleSidebar}
        isDarkMode={isDarkMode}
        onThemeToggle={toggleTheme}
      />
      
      <div className="flex">
        <Sidebar 
          isCollapsed={sidebarCollapsed}
          onToggle={toggleSidebar}
        />
        
        <main className={cn(
          'flex-1 min-h-screen transition-all duration-300',
          sidebarCollapsed ? 'md:ml-16' : 'md:ml-64',
          'ml-0' // Always start with 0 margin on mobile
        )}>
          <div className={cn(
            'min-h-screen',
            isDarkMode ? 'bg-gray-950' : 'bg-gray-50'
          )}>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}