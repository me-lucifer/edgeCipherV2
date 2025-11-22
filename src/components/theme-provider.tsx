"use client"

import { createContext, useContext, useEffect, useState, useMemo } from "react"

export type Theme = "teal" | "purple" | "lime" | "gold";

type ThemeProviderProps = {
  children: React.ReactNode
  defaultTheme?: Theme
  storageKey?: string
}

type ThemeProviderState = {
  theme: Theme
  setTheme: (theme: Theme) => void
}

const initialState: ThemeProviderState = {
  theme: "teal",
  setTheme: () => null,
}

const ThemeProviderContext = createContext<ThemeProviderState>(initialState)

export function ThemeProvider({
  children,
  defaultTheme = "teal",
  storageKey = "ec_theme",
  ...props
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem(storageKey) as Theme) || defaultTheme
    }
    return defaultTheme
  })

  useEffect(() => {
    const root = window.document.documentElement
    
    root.classList.remove("theme-teal", "theme-purple", "theme-lime", "theme-gold")

    if (theme) {
      root.classList.add(`theme-${theme}`)
    }
  }, [theme])

  const value = useMemo(() => ({
    theme,
    setTheme: (theme: Theme) => {
      if (typeof window !== 'undefined') {
        localStorage.setItem(storageKey, theme)
      }
      setTheme(theme)
    },
  }), [theme, storageKey]);

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  )
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext)

  if (context === undefined)
    throw new Error("useTheme must be used within a ThemeProvider")

  return context
}
