
class AdminService {
  constructor() {
    this.baseURL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
  }

  
  async makeRequest(endpoint, options = {}, retries = 3) {
    const url = `${this.baseURL}${endpoint}`;

    const config = {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      credentials: "include", 
    };

    
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const response = await fetch(url, config);
        const data = await response.json();

        if (!response.ok) {
          
          if (response.status === 401) {
            console.error(
              "Authentication failed. Token may be invalid or expired."
            );
            
            localStorage.removeItem("user");
            window.location.href = "/login";
            throw new Error("Authentication failed");
          }

          throw new Error(data.message || "API request failed");
        }

        return data;
      } catch (error) {
        console.error(`Admin API Error (attempt ${attempt}):`, error);
        if (attempt === retries) {
          throw error;
        }
        
        await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
      }
    }
  }

  
  async getDashboardStats() {
    return this.makeRequest("/admin/dashboard");
  }

  
  async getPendingProfiles(page = 1, limit = 10) {
    return this.makeRequest(
      `/admin/profiles/pending?page=${page}&limit=${limit}`
    );
  }

  
  async getApprovedProfiles(page = 1, limit = 10, search = "") {
    const query = search ? `&search=${encodeURIComponent(search)}` : "";
    return this.makeRequest(
      `/admin/profiles/approved?page=${page}&limit=${limit}${query}`
    );
  }

  
  async approveProfile(profileId) {
    return this.makeRequest(`/admin/profiles/${profileId}/approve`, {
      method: "PUT",
    });
  }

  
  async rejectProfile(profileId, reason) {
    return this.makeRequest(`/admin/profiles/${profileId}/reject`, {
      method: "PUT",
      body: JSON.stringify({ reason }),
    });
  }

  
  async getProfileDetails(profileId) {
    return this.makeRequest(`/admin/profiles/${profileId}`);
  }

  
  async updateProfile(profileId, profileData) {
    return this.makeRequest(`/admin/profiles/${profileId}`, {
      method: "PUT",
      body: JSON.stringify(profileData),
    });
  }

  
  async getUsers(page = 1, limit = 10, search = "") {
    const query = search ? `&search=${encodeURIComponent(search)}` : "";
    return this.makeRequest(`/admin/users?page=${page}&limit=${limit}${query}`);
  }

  
  async deleteProfile(profileId) {
    return this.makeRequest(`/admin/profiles/${profileId}`, {
      method: "DELETE",
    });
  }

  
  async getReports(page = 1, limit = 10, status = "", priority = "") {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    if (status) params.append("status", status);
    if (priority) params.append("priority", priority);

    return this.makeRequest(`/admin/reports?${params.toString()}`);
  }

  
  async takeReportAction(reportId, action, notes = "", actionTaken = "none") {
    return this.makeRequest(`/admin/reports/${reportId}/action`, {
      method: "PUT",
      body: JSON.stringify({ action, notes, actionTaken }),
    });
  }

  
  async getVerificationRequests(page = 1, limit = 10000) {
    return this.makeRequest(
      `/admin/verification-requests?page=${page}&limit=${limit}`
    );
  }

  
  async approveVerification(userId, university) {
    return this.makeRequest(`/admin/verification-requests/${userId}/approve`, {
      method: "PUT",
      body: JSON.stringify({ university }),
    });
  }

  
  async rejectVerification(userId) {
    return this.makeRequest(`/admin/verification-requests/${userId}/reject`, {
      method: "PUT",
    });
  }

  
  async getPendingTransactions() {
    return this.makeRequest("/transactions/pending");
  }

  
  async getAllTransactions() {
    return this.makeRequest("/transactions/all");
  }

  
  async approveTransaction(transactionId) {
    return this.makeRequest(`/transactions/${transactionId}/approve`, {
      method: "PUT",
    });
  }

  
  async rejectTransaction(transactionId) {
    return this.makeRequest(`/transactions/${transactionId}/reject`, {
      method: "PUT",
    });
  }

  async restrictUser(userId) {
    return this.makeRequest(`/admin/users/${userId}/restrict`, {
      method: "PUT",
    });
  }

  async banUser(userId) {
    return this.makeRequest(`/admin/users/${userId}/ban`, {
      method: "PUT",
    });
  }

  async deleteUser(userId) {
    return this.makeRequest(`/admin/users/${userId}`, {
      method: "DELETE",
    });
  }

  async getRestrictedUsers(page = 1, limit = 30, search = "") {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    if (search) params.append("search", search);

    return this.makeRequest(`/admin/users/restricted?${params}`);
  }

  async getBannedUsers(page = 1, limit = 30, search = "") {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    if (search) params.append("search", search);

    return this.makeRequest(`/admin/users/banned?${params}`);
  }

  async unrestrictUser(userId) {
    return this.makeRequest(`/admin/users/${userId}/unrestrict`, {
      method: "PUT",
    });
  }

  async unbanUser(userId) {
    return this.makeRequest(`/admin/users/${userId}/unban`, {
      method: "PUT",
    });
  }

  
  async getUniversities() {
    return this.makeRequest("/config/universities", {
      method: "GET",
    });
  }
}

export default new AdminService();
