
class AuthService {
  constructor() {
    this.baseURL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
    this.universities = null;
  }

  
  setUserSession(user) {
    
    const { token, ...userData } = user;
    if (token) {
      localStorage.setItem("token", token);
    }
    localStorage.setItem("user", JSON.stringify(userData));
    localStorage.setItem("loginTimestamp", Date.now().toString());
  }

  
  getCurrentUser() {
    try {
      const user = localStorage.getItem("user");
      return user ? JSON.parse(user) : null;
    } catch (error) {
      console.error("Error parsing user data:", error);
      return null;
    }
  }

  
  isAuthenticated() {
    const user = this.getCurrentUser();
    return !!user;
  }

  
  async getCurrentUserFromServer() {
    try {
      const response = await this.makeRequest("/auth/me", {
        method: "GET",
      });
      if (response.success) {
        
        this.setUserSession(response.user);
        return response.user;
      }
      return null;
    } catch (error) {
      console.error("Error fetching current user from server:", error);
      return null;
    }
  }

  
  async logout() {
    try {
      
      await this.makeRequest("/auth/logout", { method: "POST" });
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      
      localStorage.removeItem("user");
      localStorage.removeItem("token");
      localStorage.removeItem("loginTimestamp");
    }
  }

  
  async fetchUniversities() {
    try {
      const response = await this.makeRequest("/config/universities", {
        method: "GET",
      });
      if (response.success) {
        this.universities = response.universities;
        return response.universities;
      }
      return null;
    } catch (error) {
      console.error("Error fetching universities:", error);
      return null;
    }
  }

  
  async getUniversities() {
    if (!this.universities) {
      await this.fetchUniversities();
    }
    return this.universities;
  }

  
  async isValidUniversityEmail(email) {
    const universities = await this.getUniversities();
    if (!universities) return false;

    return Object.values(universities).some((config) =>
      config.emailDomains.some((domain) => email.endsWith(domain))
    );
  }

  
  async isValidBRACUEmail(email) {
    return this.isValidUniversityEmail(email);
  }

  
  async makeRequest(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;

    const config = {
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include", 
      ...options,
    };

    
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        
        const error = new Error(data.message || "Request failed");
        error.status = response.status;
        error.statusText = response.statusText;
        throw error;
      }

      return data;
    } catch (error) {
      
      if (error instanceof TypeError && error.message.includes("fetch")) {
        const networkError = new Error("Network error: Unable to reach server");
        networkError.status = 0; 
        throw networkError;
      }
      throw error;
    }
  }

  
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

  
  async getCurrentUserFromServer() {
    try {
      const response = await this.makeRequest("/auth/me");
      if (response.success) {
        
        this.setUserSession(response.user);
        return response.user;
      }
      return null;
    } catch (error) {
      console.error("Error fetching current user:", error);

      
      
      if (
        error.status === 401 ||
        error.message?.includes("Invalid token") ||
        error.message?.includes("Token has expired") ||
        error.message?.includes("authorization denied")
      ) {
        console.warn("Authentication failed, logging out user");
        this.logout();
      }
      
      return null;
    }
  }

  
  hasCompletedProfile(user = null) {
    const currentUser = user || this.getCurrentUser();
    return currentUser && currentUser.hasProfile;
  }

  
  isSessionValid() {
    const token = localStorage.getItem("token");
    const timestamp = localStorage.getItem("loginTimestamp");

    if (!token || !timestamp) return false;

    const loginTime = parseInt(timestamp);
    const currentTime = Date.now();
    const sessionDuration = 7 * 24 * 60 * 60 * 1000; 

    return currentTime - loginTime < sessionDuration;
  }
}


export default new AuthService();
