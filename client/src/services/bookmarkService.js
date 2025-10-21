// Bookmark service for handling bookmark operations
import authService from "./authService";

class BookmarkService {
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

  // Add a profile to bookmarks
  async addBookmark(profileId) {
    try {
      const response = await this.makeRequest("/bookmarks", {
        method: "POST",
        body: JSON.stringify({ profileId }),
      });
      return response;
    } catch (error) {
      console.error("Add bookmark error:", error);
      throw error;
    }
  }

  // Remove a profile from bookmarks
  async removeBookmark(profileId) {
    try {
      const response = await this.makeRequest(`/bookmarks/${profileId}`, {
        method: "DELETE",
      });
      return response;
    } catch (error) {
      console.error("Remove bookmark error:", error);
      throw error;
    }
  }

  // Get all bookmarks for current user with pagination
  async getBookmarks(page = 1, limit = 9) {
    try {
      const response = await this.makeRequest(
        `/bookmarks?page=${page}&limit=${limit}`
      );
      return response;
    } catch (error) {
      console.error("Get bookmarks error:", error);
      throw error;
    }
  }

  // Check if a profile is bookmarked
  async isBookmarked(profileId) {
    try {
      const response = await this.makeRequest(`/bookmarks/check/${profileId}`);
      return response;
    } catch (error) {
      console.error("Check bookmark error:", error);
      throw error;
    }
  }

  // Toggle bookmark status for a profile
  async toggleBookmark(profileId) {
    try {
      const checkResponse = await this.isBookmarked(profileId);

      if (checkResponse.isBookmarked) {
        return await this.removeBookmark(profileId);
      } else {
        return await this.addBookmark(profileId);
      }
    } catch (error) {
      console.error("Toggle bookmark error:", error);
      throw error;
    }
  }

  // Get bookmark statistics for current user
  async getStats() {
    try {
      const response = await this.makeRequest("/bookmarks/stats");
      return response;
    } catch (error) {
      console.error("Get bookmark stats error:", error);
      throw error;
    }
  }
}

// Export singleton instance
export default new BookmarkService();
