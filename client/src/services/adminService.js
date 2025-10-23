// Admin service for handling admin-related API calls
class AdminService {
  constructor() {
    this.baseURL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
  }

  // Make authenticated API request
  async makeRequest(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;

    const config = {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      credentials: "include", // Include cookies for backward compatibility
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
        // Check if it's an authentication error
        if (response.status === 401) {
          console.error(
            "Authentication failed. Token may be invalid or expired."
          );
          // Clear user data and redirect to login
          localStorage.removeItem("user");
          window.location.href = "/login";
        }

        throw new Error(data.message || "API request failed");
      }

      return data;
    } catch (error) {
      console.error("Admin API Error:", error);
      throw error;
    }
  }

  // Get dashboard statistics
  async getDashboardStats() {
    return this.makeRequest("/admin/dashboard");
  }

  // Get pending profiles
  async getPendingProfiles(page = 1, limit = 10) {
    return this.makeRequest(
      `/admin/profiles/pending?page=${page}&limit=${limit}`
    );
  }

  // Get approved profiles
  async getApprovedProfiles(page = 1, limit = 10, search = "") {
    const query = search ? `&search=${encodeURIComponent(search)}` : "";
    return this.makeRequest(
      `/admin/profiles/approved?page=${page}&limit=${limit}${query}`
    );
  }

  // Approve a profile
  async approveProfile(profileId) {
    return this.makeRequest(`/admin/profiles/${profileId}/approve`, {
      method: "PUT",
    });
  }

  // Reject a profile
  async rejectProfile(profileId, reason) {
    return this.makeRequest(`/admin/profiles/${profileId}/reject`, {
      method: "PUT",
      body: JSON.stringify({ reason }),
    });
  }

  // Get profile details
  async getProfileDetails(profileId) {
    return this.makeRequest(`/admin/profiles/${profileId}`);
  }

  // Update profile details
  async updateProfile(profileId, profileData) {
    return this.makeRequest(`/admin/profiles/${profileId}`, {
      method: "PUT",
      body: JSON.stringify(profileData),
    });
  }

  // Get all users
  async getUsers(page = 1, limit = 10, search = "") {
    const query = search ? `&search=${encodeURIComponent(search)}` : "";
    return this.makeRequest(`/admin/users?page=${page}&limit=${limit}${query}`);
  }

  // Delete a profile
  async deleteProfile(profileId) {
    return this.makeRequest(`/admin/profiles/${profileId}`, {
      method: "DELETE",
    });
  }

  // Get profile reports
  async getReports(page = 1, limit = 10, status = "", priority = "") {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    if (status) params.append("status", status);
    if (priority) params.append("priority", priority);

    return this.makeRequest(`/admin/reports?${params.toString()}`);
  }

  // Take action on a report
  async takeReportAction(reportId, action, notes = "", actionTaken = "none") {
    return this.makeRequest(`/admin/reports/${reportId}/action`, {
      method: "PUT",
      body: JSON.stringify({ action, notes, actionTaken }),
    });
  }

  // Get verification requests
  async getVerificationRequests(page = 1, limit = 10000) {
    return this.makeRequest(
      `/admin/verification-requests?page=${page}&limit=${limit}`
    );
  }

  // Approve verification request
  async approveVerification(userId) {
    return this.makeRequest(`/admin/verification-requests/${userId}/approve`, {
      method: "PUT",
    });
  }

  // Reject verification request
  async rejectVerification(userId) {
    return this.makeRequest(`/admin/verification-requests/${userId}/reject`, {
      method: "PUT",
    });
  }

  // Get pending transactions
  async getPendingTransactions() {
    return this.makeRequest("/transactions/pending");
  }

  // Approve transaction
  async approveTransaction(transactionId) {
    return this.makeRequest(`/transactions/${transactionId}/approve`, {
      method: "PUT",
    });
  }

  // Reject transaction
  async rejectTransaction(transactionId) {
    return this.makeRequest(`/transactions/${transactionId}/reject`, {
      method: "PUT",
    });
  }
}

export default new AdminService();
