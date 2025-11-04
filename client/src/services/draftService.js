import authService from "./authService";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";


const makeRequest = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;

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
};

const draftService = {
  
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
