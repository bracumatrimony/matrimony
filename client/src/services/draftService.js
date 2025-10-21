import authService from "./authService";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// Make API request with authentication
const makeRequest = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;

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
    const error = new Error(data.message || "Request failed");
    error.response = { data };
    throw error;
  }

  return data;
};

const draftService = {
  // Save draft to server
  saveDraft: async (currentStep, draftData) => {
    try {
      const response = await makeRequest("/drafts", {
        method: "POST",
        body: JSON.stringify({
          currentStep,
          draftData,
        }),
      });
      return response;
    } catch (error) {
      console.error("Error saving draft:", error);
      throw error;
    }
  },

  // Get draft from server
  getDraft: async () => {
    try {
      const response = await makeRequest("/drafts", {
        method: "GET",
      });
      return response;
    } catch (error) {
      console.error("Error fetching draft:", error);
      throw error;
    }
  },

  // Delete draft from server
  deleteDraft: async () => {
    try {
      const response = await makeRequest("/drafts", {
        method: "DELETE",
      });
      return response;
    } catch (error) {
      console.error("Error deleting draft:", error);
      throw error;
    }
  },

  // Save draft with debouncing to avoid too many server calls
  saveDraftDebounced: (() => {
    let timeoutId;
    return (currentStep, draftData, delay = 2000) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        draftService.saveDraft(currentStep, draftData);
      }, delay);
    };
  })(),
};

export default draftService;
