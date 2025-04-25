"use client";

import { MantineProvider, createTheme } from "@mantine/core";
import { Notifications } from "@mantine/notifications";
import { ModalsProvider } from "@mantine/modals";
import { useState, useEffect, ReactNode } from "react";

// Define your custom theme
const theme = createTheme({
  primaryColor: "blue",
  defaultRadius: "md",
  fontFamily: "var(--font-geist-sans)",
  fontFamilyMonospace: "var(--font-geist-mono)",
  headings: {
    fontFamily: "var(--font-geist-sans)",
    fontWeight: "600",
  },
});

export function Providers({ children }: { children: ReactNode }) {
  // Handle color scheme detection and settings
  const [colorScheme, setColorScheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    // Check for user preference in localStorage
    const savedScheme = localStorage.getItem("color-scheme") as
      | "light"
      | "dark"
      | null;

    if (savedScheme) {
      setColorScheme(savedScheme);
    } else if (
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches
    ) {
      // Use system preference if no saved preference
      setColorScheme("dark");
    }

    // Listen for system preference changes
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = (e: MediaQueryListEvent) => {
      if (!localStorage.getItem("color-scheme")) {
        setColorScheme(e.matches ? "dark" : "light");
      }
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  // Toggle color scheme function
  const toggleColorScheme = () => {
    const newScheme = colorScheme === "dark" ? "light" : "dark";
    setColorScheme(newScheme);
    localStorage.setItem("color-scheme", newScheme);
  };

  return (
    <MantineProvider theme={theme} defaultColorScheme={colorScheme}>
      <Notifications position="top-right" zIndex={1000} />
      <ModalsProvider>{children}</ModalsProvider>
    </MantineProvider>
  );
}
