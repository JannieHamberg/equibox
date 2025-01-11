'use client'

import { useEffect } from 'react'
import { Moon, Sun } from 'lucide-react'

export default function ThemeToggle() {
  useEffect(() => {
    // Check for saved theme preference
    const savedTheme = localStorage.getItem('theme') || 'light'
    document.documentElement.setAttribute('data-theme', savedTheme)
  }, [])

  const toggleTheme = () => {
    const currentTheme = document.documentElement.getAttribute('data-theme')
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark'
    document.documentElement.setAttribute('data-theme', newTheme)
    localStorage.setItem('theme', newTheme)
  }

  return (
    <label className="swap swap-rotate">
      <input type="checkbox" onClick={toggleTheme} />
      <Sun className="swap-on h-5 w-5" />
      <Moon className="swap-off h-5 w-5" />
    </label>
  )
} 