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
      isDarkMode && 'dark'
    )}>
      <Header
        onMenuClick={toggleSidebar}
        isDarkMode={isDarkMode}
        onThemeToggle={toggleTheme}
      />

      <div className={cn(
        "grid min-h-screen",
        !sidebarCollapsed ? "md:grid-cols-[256px_1fr]" : "md:grid-cols-[64px_1fr]",
        "grid-cols-1"
      )}>
        <Sidebar
          isCollapsed={sidebarCollapsed}
          onToggle={toggleSidebar}
        />

        <main className="bg-background min-h-0">
          {children}
        </main>
      </div>
    </div>
  );
}
