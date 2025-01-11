'use client'

import { useEffect } from 'react'
import { Moon, Sun } from 'lucide-react'

export default function ThemeToggle() {
  useEffect(() => {
    // Check for saved theme preference or system preference
    const savedTheme = localStorage.getItem('theme')
    if (savedTheme) {
      document.documentElement.setAttribute('data-theme', savedTheme)
    }
  }, [])

  const toggleTheme = () => {
    const currentTheme = document.documentElement.getAttribute('data-theme')
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark'
    document.documentElement.setAttribute('data-theme', newTheme)
    localStorage.setItem('theme', newTheme)
  }

  return (
    <button 
      onClick={toggleTheme}
      className="btn btn-ghost btn-circle"
      aria-label="Toggle theme"
    >
      <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
    </button>
  )
} 