import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import authService from "../services/authService";

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in on app start
    const initializeAuth = async () => {
      const currentUser = authService.getCurrentUser();
      const isValidSession = authService.isSessionValid();
      if (currentUser && isValidSession) {
        // Try to refresh user data from server for latest info
        try {
          const freshUser = await authService.getCurrentUserFromServer();
          if (freshUser) {
            setUser(freshUser);
          } else {
            setUser(currentUser);
          }
        } catch (error) {
          console.error("Failed to refresh user on init:", error);
          setUser(currentUser);
        }
        setLoading(false);
      } else if (currentUser && !isValidSession) {
        // Session expired (24+ hours old), logout
        console.warn("Session expired, logging out");
        authService.logout();
        setUser(null);
        setLoading(false);
      } else {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = useCallback((userData) => {
    authService.setUserSession(userData);
    setUser(userData);
  }, []);

  const logout = useCallback(() => {
    authService.logout();
    setUser(null);
  }, []);

  const updateUser = useCallback((updatedUser) => {
    setUser(updatedUser);
    authService.setUserSession(updatedUser);
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const freshUserData = await authService.getCurrentUserFromServer();
      if (freshUserData) {
        setUser(freshUserData);
        return freshUserData;
      }
      return null;
    } catch (error) {
      console.error("Failed to refresh user data:", error);
      return null;
    }
  }, []);

  const value = {
    user,
    login,
    logout,
    updateUser,
    refreshUser,
    loading,
    isAuthenticated: !!user && authService.isSessionValid(),
    hasCompletedProfile: authService.hasCompletedProfile(user),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
