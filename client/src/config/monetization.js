// Environment Configuration for Client
// Fetches monetization configuration from server

class MonetizationConfig {
  constructor() {
    // Try to load cached config from localStorage first
    const cachedConfig = this.getCachedConfig();
    this.mode = cachedConfig || "off"; // Default to off until server config is loaded
    this.isLoading = !cachedConfig; // Not loading if we have cached config

    // Only load from server if we don't have cached config or it's expired
    if (!cachedConfig || this.isCacheExpired()) {
      this.loadServerConfig(); // Load config from server
    }
  }

  // Get cached config from localStorage
  getCachedConfig() {
    try {
      const cached = localStorage.getItem("monetizationConfig");
      if (cached) {
        const { mode, timestamp } = JSON.parse(cached);
        return mode;
      }
    } catch (error) {
      console.warn("Failed to load cached monetization config:", error);
    }
    return null;
  }

  // Check if cache is expired (1 hour)
  isCacheExpired() {
    try {
      const cached = localStorage.getItem("monetizationConfig");
      if (cached) {
        const { timestamp } = JSON.parse(cached);
        const oneHour = 60 * 60 * 1000;
        return Date.now() - timestamp > oneHour;
      }
    } catch (error) {
      return true;
    }
    return true;
  }

  // Save config to localStorage
  saveToCache(mode) {
    try {
      localStorage.setItem(
        "monetizationConfig",
        JSON.stringify({
          mode,
          timestamp: Date.now(),
        })
      );
    } catch (error) {
      console.warn("Failed to cache monetization config:", error);
    }
  }

  // Fetch configuration from server
  async loadServerConfig() {
    try {
      // Get API URL from environment variable or use default for development
      const apiUrl =
        import.meta.env.VITE_API_URL || "http://localhost:5000/api";
      const response = await fetch(`${apiUrl}/config/monetization`);
      const data = await response.json();

      if (data.success) {
        this.mode = data.monetization;
        this.isLoading = false;

        // Save to cache
        this.saveToCache(this.mode);

        // Trigger re-render for any listening components
        if (typeof window !== "undefined") {
          window.dispatchEvent(
            new CustomEvent("monetizationConfigChanged", {
              detail: { mode: this.mode },
            })
          );
        }
      }
    } catch (error) {
      console.warn(
        "Failed to load monetization config from server, using default (off):",
        error
      );
      this.isLoading = false;
    }
  }

  // Check if monetization is enabled
  isEnabled() {
    return this.mode === "on";
  }

  // Check if credit system should be active
  isCreditSystemEnabled() {
    return this.isEnabled();
  }

  // Check if monetization routes should be available
  shouldShowRoutes() {
    return this.isEnabled();
  }

  // Check if credit UI should be displayed
  shouldShowCreditUI() {
    return this.isEnabled();
  }

  // Get free access message
  getFreeAccessMessage() {
    return this.isEnabled() ? null : "🎉 Launch Period - Everything is FREE!";
  }

  // Get configuration summary
  getConfig() {
    return {
      monetizationEnabled: this.isEnabled(),
      creditSystemEnabled: this.isCreditSystemEnabled(),
      showCreditUI: this.shouldShowCreditUI(),
      showRoutes: this.shouldShowRoutes(),
      freeAccessMessage: this.getFreeAccessMessage(),
      mode: this.mode,
    };
  }
}

// Create and export the monetization config instance
export const monetizationConfig = new MonetizationConfig();

// Legacy support for existing code
export const TEMPORARY_CONFIG = {
  get ENABLE_CREDIT_SYSTEM() {
    return monetizationConfig.isCreditSystemEnabled();
  },
  get LAUNCH_MESSAGE() {
    return monetizationConfig.getFreeAccessMessage() || "";
  },
  get SHOW_LAUNCH_MESSAGE() {
    return !monetizationConfig.isEnabled();
  },
};

export default monetizationConfig;
