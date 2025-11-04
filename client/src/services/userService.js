
import authService from "./authService";

class UserService {
  constructor() {
    this.baseURL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
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

    const response = await fetch(url, config);
    const data = await response.json();

    if (!response.ok) {
      
      const error = new Error(data.message || "Request failed");
      error.response = { data };
      throw error;
    }

    return data;
  }

  
  async getUserProfile() {
    try {
      const response = await this.makeRequest("/users/profile");
      return response;
    } catch (error) {
      console.error("Get user profile error:", error);
      throw error;
    }
  }

  
  async updateUserProfile(userData) {
    try {
      const response = await this.makeRequest("/users/profile", {
        method: "PUT",
        body: JSON.stringify(userData),
      });
      return response;
    } catch (error) {
      console.error("Update user profile error:", error);
      throw error;
    }
  }

  
  async updateUserCredits(credits, operation = "add") {
    try {
      const response = await this.makeRequest("/users/credits", {
        method: "PUT",
        body: JSON.stringify({ credits, operation }),
      });
      return response;
    } catch (error) {
      console.error("Update user credits error:", error);
      throw error;
    }
  }

  
  async getUserCredits() {
    try {
      const response = await this.getUserProfile();
      return {
        success: true,
        credits: response.user?.credits || 0,
      };
    } catch (error) {
      console.error("Get user credits error:", error);
      throw error;
    }
  }

  
  async deleteAccount() {
    try {
      const response = await this.makeRequest("/users/account", {
        method: "DELETE",
      });
      return response;
    } catch (error) {
      console.error("Delete account error:", error);
      throw error;
    }
  }
  
  async getUserStats() {
    try {
      const response = await this.makeRequest("/users/stats");
      return response;
    } catch (error) {
      console.error("Get user stats error:", error);
      throw error;
    }
  }
}


export default new UserService();
