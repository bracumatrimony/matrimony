// Authentication service for handling email/password auth
class AuthService {
  constructor() {
    this.baseURL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
  }

  // Store user data and token
  setUserSession(user) {
    // Extract token from user object if present
    const { token, ...userData } = user;
    if (token) {
      localStorage.setItem("token", token);
    }
    localStorage.setItem("user", JSON.stringify(userData));
    localStorage.setItem("loginTimestamp", Date.now().toString());
  }

  // Get current user from storage
  getCurrentUser() {
    try {
      const user = localStorage.getItem("user");
      return user ? JSON.parse(user) : null;
    } catch (error) {
      console.error("Error parsing user data:", error);
      return null;
    }
  }

  // Check if user is authenticated (user data exists)
  isAuthenticated() {
    const user = this.getCurrentUser();
    return !!user;
  }

  // Get fresh user data from server
  async getCurrentUserFromServer() {
    try {
      const response = await this.makeRequest("/auth/me", {
        method: "GET",
      });
      if (response.success) {
        // Update localStorage with fresh data
        this.setUserSession(response.user);
        return response.user;
      }
      return null;
    } catch (error) {
      console.error("Error fetching current user from server:", error);
      return null;
    }
  }

  // Logout user
  async logout() {
    try {
      // Call logout endpoint to clear cookie
      await this.makeRequest("/auth/logout", { method: "POST" });
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      // Clear local storage regardless
      localStorage.removeItem("user");
      localStorage.removeItem("token");
      localStorage.removeItem("loginTimestamp");
    }
  }

  // Validate BRACU email (only for biodata creation)
  isValidBRACUEmail(email) {
    return email.endsWith("@g.bracu.ac.bd") || email.endsWith("@bracu.ac.bd");
  }

  // Make API request with authentication
  async makeRequest(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;

    const config = {
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include", // Include cookies in requests for backward compatibility
      ...options,
    };

    // Add Authorization header if token exists
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        // Create detailed error with status information
        const error = new Error(data.message || "Request failed");
        error.status = response.status;
        error.statusText = response.statusText;
        throw error;
      }

      return data;
    } catch (error) {
      // Handle network errors (fetch failed)
      if (error instanceof TypeError && error.message.includes("fetch")) {
        const networkError = new Error("Network error: Unable to reach server");
        networkError.status = 0; // Network error indicator
        throw networkError;
      }
      throw error;
    }
  }

  // Email/password authentication
  async authenticateWithEmail(email, password, authType = "login", name = "") {
    try {
      const endpoint = authType === "login" ? "/auth/login" : "/auth/register";
      const body =
        authType === "login" ? { email, password } : { name, email, password };

      const response = await this.makeRequest(endpoint, {
        method: "POST",
        body: JSON.stringify(body),
      });

      if (response.success) {
        this.setUserSession(response.user);
        return response;
      } else {
        throw new Error(response.message || "Authentication failed");
      }
    } catch (error) {
      console.error("Email authentication error:", error);
      throw error;
    }
  }

  // Google OAuth authentication
  async authenticateWithGoogle(credential) {
    try {
      const response = await this.makeRequest("/auth/google", {
        method: "POST",
        body: JSON.stringify({ credential }),
      });

      if (response.success) {
        this.setUserSession(response.user);
        return response;
      } else {
        throw new Error(response.message || "Google authentication failed");
      }
    } catch (error) {
      console.error("Google authentication error:", error);
      throw error;
    }
  }

  // Get current user from server
  async getCurrentUserFromServer() {
    try {
      const response = await this.makeRequest("/auth/me");
      if (response.success) {
        // Update local storage with fresh user data
        this.setUserSession(response.user);
        return response.user;
      }
      return null;
    } catch (error) {
      console.error("Error fetching current user:", error);

      // FIX: Only logout on authentication errors (401), not on network/server errors
      // This prevents auto-logout on temporary network issues or server problems
      if (
        error.status === 401 ||
        error.message?.includes("Invalid token") ||
        error.message?.includes("Token has expired") ||
        error.message?.includes("authorization denied")
      ) {
        console.warn("Authentication failed, logging out user");
        this.logout();
      }
      // For other errors (network issues, 500 errors), keep the user logged in with cached data
      return null;
    }
  }

  // Get user profile completion status
  hasCompletedProfile(user = null) {
    const currentUser = user || this.getCurrentUser();
    return currentUser && currentUser.hasProfile;
  }

  // Check session validity
  isSessionValid() {
    const token = localStorage.getItem("token");
    const timestamp = localStorage.getItem("loginTimestamp");

    if (!token || !timestamp) return false;

    const loginTime = parseInt(timestamp);
    const currentTime = Date.now();
    const sessionDuration = 7 * 24 * 60 * 60 * 1000; // 7 days (matches JWT expiration)

    return currentTime - loginTime < sessionDuration;
  }
}

// Export singleton instance
export default new AuthService();
