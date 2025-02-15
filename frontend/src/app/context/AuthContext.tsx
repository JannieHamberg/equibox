"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { authFetch } from "../utils/authFetch";

interface AuthContextType {
  userType: string;
  isLoggedIn: boolean;
}

// Create Context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// AuthProvider Component
export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [userType, setUserType] = useState("guest");
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    async function fetchAuthStatus() {
      try {
        const token = sessionStorage.getItem("authToken");
        
        if (!token) {
          setUserType("guest");
          setIsLoggedIn(false);
          window.dataLayer?.push({ 'event': 'userTypeDefined', 'user_type': 'guest' });
          return;
        }

        const response = await authFetch("https://backend.equibox.se/wp-json/custom/v1/auth-status");

        if (!response.ok) {
          sessionStorage.removeItem("authToken");  // Auto logout on invalid token
          setUserType("guest");
          setIsLoggedIn(false);
          window.dataLayer?.push({ 'event': 'userTypeDefined', 'user_type': 'guest' });
          return;
        }

        const data = await response.json();
        
        if (data.logged_in && (userType !== data.user_type || !isLoggedIn)) {
            console.log("Auth Status:", data);
          setUserType(data.user_type);
          setIsLoggedIn(true);
          window.dataLayer?.push({ 'event': 'userTypeDefined', 'user_type': 'logged_in' });
        }
      } catch (error) {
        console.error("Error fetching auth status:", error);
      }
    }

    fetchAuthStatus();
  }, []);

  return (
    <AuthContext.Provider value={{ userType, isLoggedIn }}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook for easy access
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
