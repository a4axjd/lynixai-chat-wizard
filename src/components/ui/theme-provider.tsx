
"use client"

import * as React from "react"
import { createContext, useContext, useEffect, useState } from "react"

type Theme = "dark" | "light" | "system"

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
  theme: "system",
  setTheme: () => null,
}

const ThemeProviderContext = createContext<ThemeProviderState>(initialState)

export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = "ui-theme",
  ...props
}: ThemeProviderProps) {
  // Use null as initial state to prevent hydration mismatch
  const [theme, setTheme] = useState<Theme | null>(null)
  
  // Initialize theme safely on mount
  useEffect(() => {
    const storedTheme = localStorage?.getItem(storageKey) as Theme || defaultTheme
    setTheme(storedTheme)
  }, [defaultTheme, storageKey])

  // Apply theme class when theme changes
  useEffect(() => {
    if (theme) {
      const root = window.document.documentElement
      root.classList.remove("light", "dark")

      if (theme === "system") {
        const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
          .matches
          ? "dark"
          : "light"
        root.classList.add(systemTheme)
      } else {
        root.classList.add(theme)
      }
    }
  }, [theme])

  // Avoid rendering children until theme is initialized
  const value = React.useMemo(
    () => ({
      theme: theme || defaultTheme,
      setTheme: (newTheme: Theme) => {
        localStorage?.setItem(storageKey, newTheme)
        setTheme(newTheme)
      },
    }),
    [theme, defaultTheme, storageKey]
  )

  // Only render children once theme is initialized in browser
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
