// Profile service for handling profile operations
import authService from "./authService";

class ProfileService {
  constructor() {
    this.baseURL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
  }

  // Make API request with authentication
  async makeRequest(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;

    const config = {
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include", // Include cookies for backward compatibility
      ...options,
    };

    // Add Authorization header if token exists
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(url, config);
    const data = await response.json();

    if (!response.ok) {
      // Create a custom error object that includes the response data
      const error = new Error(data.message || "Request failed");
      error.response = {
        data,
        status: response.status,
        statusText: response.statusText,
      };
      throw error;
    }

    return data;
  }

  // Make public API request without authentication
  async makePublicRequest(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;

    const config = {
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include", // Include cookies for all requests
      ...options,
    };

    const response = await fetch(url, config);
    const data = await response.json();

    if (!response.ok) {
      // Create a custom error object that includes the response data
      const error = new Error(data.message || "Request failed");
      error.response = {
        data,
        status: response.status,
        statusText: response.statusText,
      };
      throw error;
    }

    return data;
  }

  // Create a new profile
  async createProfile(profileData) {
    try {
      const response = await this.makeRequest("/profiles", {
        method: "POST",
        body: JSON.stringify(profileData),
      });

      return response;
    } catch (error) {
      console.error("Create profile error:", error);
      throw error;
    }
  }

  // Get current user's profile
  async getCurrentUserProfile() {
    try {
      const response = await this.makeRequest("/profiles/user/me");
      return response;
    } catch (error) {
      console.error("Get user profile error:", error);
      throw error;
    }
  }

  // Update current user's profile
  async updateProfile(profileData) {
    try {
      const response = await this.makeRequest("/profiles/user/me", {
        method: "PUT",
        body: JSON.stringify(profileData),
      });

      return response;
    } catch (error) {
      console.error("Update profile error:", error);
      throw error;
    }
  }

  // Delete current user's profile
  async deleteProfile() {
    try {
      const response = await this.makeRequest("/profiles", {
        method: "DELETE",
      });

      return response;
    } catch (error) {
      console.error("Delete biodata error:", error);
      throw error;
    }
  }

  // Search profiles with filters
  async searchProfiles(filters = {}, options = {}) {
    try {
      const queryParams = new URLSearchParams();

      Object.keys(filters).forEach((key) => {
        if (
          filters[key] !== "" &&
          filters[key] !== null &&
          filters[key] !== undefined
        ) {
          queryParams.append(key, filters[key]);
        }
      });

      const queryString = queryParams.toString();
      const endpoint = `/profiles/search${
        queryString ? `?${queryString}` : ""
      }`;

      // Use authenticated request for search to enable view tracking
      const response = await this.makeRequest(endpoint, options);
      return response;
    } catch (error) {
      // Don't log AbortError as it's expected when requests are cancelled
      if (error.name !== "AbortError") {
        console.error("Search profiles error:", error);
      }
      throw error;
    }
  }

  // Get a single profile by profile ID
  async getProfile(profileId) {
    try {
      const response = await this.makeRequest(`/profiles/${profileId}`);
      return response;
    } catch (error) {
      console.error("Get profile error:", error);
      throw error;
    }
  }

  // Unlock contact information for a profile
  async unlockContact(profileId) {
    try {
      const response = await this.makeRequest(
        `/profiles/${profileId}/unlock-contact`,
        {
          method: "POST",
        }
      );
      return response;
    } catch (error) {
      console.error("Unlock contact error:", error);
      throw error;
    }
  }

  // Check if contact information is already unlocked for a profile
  async checkContactStatus(profileId) {
    try {
      const response = await this.makeRequest(
        `/profiles/${profileId}/contact-status`,
        {
          method: "GET",
        }
      );
      return response;
    } catch (error) {
      console.error("Check contact status error:", error);
      throw error;
    }
  }

  // Fetch transaction history for the current user
  async getTransactionHistory() {
    try {
      const response = await this.makeRequest("/users/transactions", {
        method: "GET",
      });
      return response;
    } catch (error) {
      console.error("Fetch transaction history error:", error);
      throw error;
    }
  }

  // Fetch user's orders (purchase transactions)
  async getUserOrders() {
    try {
      const response = await this.makeRequest("/transactions/orders", {
        method: "GET",
      });
      return response;
    } catch (error) {
      console.error("Fetch user orders error:", error);
      throw error;
    }
  }

  // Calculate age from date of birth
  calculateAge(dateOfBirth) {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }

    return age;
  }

  // Format profile data for display
  formatProfileData(profile) {
    if (!profile) return null;

    return {
      ...profile,
      // Age is already calculated and stored in the profile
      age: profile.age || 0,
      // Add any other formatting logic here
    };
  }

  // Unlock contact information for a profile
  async unlockContactInfo(profileId) {
    try {
      const response = await this.makeRequest(
        `/profiles/${profileId}/unlock-contact`,
        {
          method: "POST",
        }
      );
      return response;
    } catch (error) {
      console.error("Unlock contact error:", error);
      throw error;
    }
  }

  // Check if contact information is already unlocked for a profile
  async checkContactStatus(profileId) {
    try {
      const response = await this.makeRequest(
        `/profiles/${profileId}/contact-status`,
        {
          method: "GET",
        }
      );
      return response;
    } catch (error) {
      console.error("Check contact status error:", error);
      throw error;
    }
  }

  // Get all unlocked profiles for the current user
  async getUnlockedProfiles() {
    try {
      const response = await this.makeRequest("/profiles/my-unlocks", {
        method: "GET",
      });
      return response;
    } catch (error) {
      console.error("Get unlocked profiles error:", error);
      throw error;
    }
  }

  // Get user's transaction history
  async getTransactionHistory() {
    try {
      const response = await this.makeRequest("/transactions/history", {
        method: "GET",
      });
      return response;
    } catch (error) {
      console.error("Get transaction history error:", error);
      throw error;
    }
  }
  async getStats() {
    try {
      const response = await this.makePublicRequest("/profiles/stats", {
        method: "GET",
      });
      return response;
    } catch (error) {
      console.error("Get stats error:", error);
      throw error;
    }
  }

  // Request alumni verification
  async requestVerification() {
    try {
      const response = await this.makeRequest(
        "/profiles/request-verification",
        {
          method: "POST",
        }
      );
      return response;
    } catch (error) {
      console.error("Request verification error:", error);
      throw error;
    }
  }
}

// Export singleton instance
export default new ProfileService();
