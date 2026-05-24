import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { apiClient } from "../services/api";
import { LoginResponse } from "../types"; // We will create types shortly

interface User {
  username: string;
  displayName: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  darkMode: boolean;
  toggleDarkMode: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [darkMode, setDarkMode] = useState<boolean>(false);

  // Initialize Auth & Theme State
  useEffect(() => {
    const storedToken = localStorage.getItem("hayat_token");
    const storedUser = localStorage.getItem("hayat_user");
    const storedTheme = localStorage.getItem("hayat_theme");

    // Load User Auth Info
    if (storedToken && storedUser) {
      setToken(storedToken);
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        // Clear corrupt storage
        localStorage.removeItem("hayat_token");
        localStorage.removeItem("hayat_user");
      }
    }

    // Load Theme Preference
    const isDark = storedTheme === "dark" || 
      (!storedTheme && window.matchMedia("(prefers-color-scheme: dark)").matches);
    
    setDarkMode(isDark);
    if (isDark) {
      document.body.classList.add("dark");
    } else {
      document.body.classList.remove("dark");
    }

    setIsLoading(false);
  }, []);

  const login = async (username: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await apiClient.post<LoginResponse>("/auth/login", {
        username,
        password
      });

      const { token: apiToken, displayName } = response.data;
      const loggedUser = { username, displayName };

      // Set state
      setToken(apiToken);
      setUser(loggedUser);

      // Save to localStorage
      localStorage.setItem("hayat_token", apiToken);
      localStorage.setItem("hayat_user", JSON.stringify(loggedUser));
    } finally {
      setIsLoading(false);
    }
  };

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("hayat_token");
    localStorage.removeItem("hayat_user");
  }, []);

  const toggleDarkMode = () => {
    setDarkMode(prev => {
      const nextTheme = !prev;
      localStorage.setItem("hayat_theme", nextTheme ? "dark" : "light");
      if (nextTheme) {
        document.body.classList.add("dark");
      } else {
        document.body.classList.remove("dark");
      }
      return nextTheme;
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token,
        isLoading,
        login,
        logout,
        darkMode,
        toggleDarkMode
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
