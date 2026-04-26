import { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark";

interface ThemeContextValue {
  theme: Theme;
  brandColor: string;
  toggleTheme: () => void;
  setBrandColor: (color: string) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: "light",
  brandColor: "230 100% 65%",
  toggleTheme: () => {},
  setBrandColor: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window === "undefined") return "light";
    const stored = localStorage.getItem("falaa-theme") as Theme | null;
    if (stored === "dark" || stored === "light") return stored;
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  });

  const [brandColor, setBrandColor] = useState<string>(() => {
    if (typeof window === "undefined") return "230 100% 65%";
    return localStorage.getItem("falaa-brand-color") || "230 100% 65%";
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    localStorage.setItem("falaa-theme", theme);
  }, [theme]);

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--primary', brandColor);
    localStorage.setItem("falaa-brand-color", brandColor);
  }, [brandColor]);

  const toggleTheme = () => setTheme((t) => (t === "dark" ? "light" : "dark"));

  return (
    <ThemeContext.Provider value={{ theme, brandColor, toggleTheme, setBrandColor }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
