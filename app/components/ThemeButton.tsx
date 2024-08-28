'use client';

import { useEffect, useState } from "react";
import { Switch } from '@/lib/shadcn/ui';


export const ThemeButton: React.FC = () => {
  const [darkMode, setDarkMode] = useState(false);
  useEffect(() => {
    const theme = localStorage.getItem('theme');
    if (theme === 'dark') {
      setDarkMode(true);
    }
  }, []);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);
  return (
    <Switch
      onCheckedChange={() => { setDarkMode(!darkMode) }}
      className='bg-slate-800 dark:bg-gray-200'
    />

  );
};
