'use client';

import { useTheme } from '@/providers/theme-provider';
import { Button } from '@/components/ui/button';
import { Moon, Sun } from 'lucide-react';
import { useEffect, useState } from 'react';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      className="rounded-full hover:bg-muted transition-colors"
    >
      {theme === 'dark' ? (
        <Sun className="h-5 w-5 text-yellow-500 transition-transform" />
      ) : (
        <Moon className="h-5 w-5 text-slate-700 transition-transform" />
      )}
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}
