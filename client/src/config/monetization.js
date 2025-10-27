// Environment Configuration for Client
// Fetches monetization configuration from server

class MonetizationConfig {
  constructor() {
    // Try to load cached config from localStorage first
    const cachedConfig = this.getCachedConfig();
    this.mode = cachedConfig ? cachedConfig.mode : "off"; // Default to off until server config is loaded
    this.serverTimestamp = cachedConfig ? cachedConfig.serverTimestamp : null;
    this.isLoading = true; // Always loading to check for updates

    // Always load from server to check for updates (server restart, env change)
    this.loadServerConfig(); // Load config from server
  }

  // Get cached config from localStorage
  getCachedConfig() {
    try {
      const cached = localStorage.getItem("monetizationConfig");
      if (cached) {
        const { mode, timestamp, serverTimestamp } = JSON.parse(cached);
        return { mode, timestamp, serverTimestamp };
      }
    } catch (error) {
      console.warn("Failed to load cached monetization config:", error);
    }
    return null;
  }

  // Check if cache is expired (5 minutes instead of 1 hour for faster updates)
  isCacheExpired() {
    try {
      const cached = localStorage.getItem("monetizationConfig");
      if (cached) {
        const { timestamp } = JSON.parse(cached);
        const fiveMinutes = 5 * 60 * 1000; // Reduced from 1 hour to 5 minutes
        return Date.now() - timestamp > fiveMinutes;
      }
    } catch (error) {
      return true;
    }
    return true;
  }

  // Save config to localStorage
  saveToCache(mode, serverTimestamp) {
    try {
      localStorage.setItem(
        "monetizationConfig",
        JSON.stringify({
          mode,
          timestamp: Date.now(),
          serverTimestamp,
        })
      );
    } catch (error) {
      console.warn("Failed to cache monetization config:", error);
    }
  }

  // Force refresh configuration from server
  async forceRefresh() {
    try {
      this.isLoading = true;
      // Clear cache to force fresh load
      localStorage.removeItem("monetizationConfig");
      this.serverTimestamp = null;

      await this.loadServerConfig();
      return this.mode;
    } catch (error) {
      console.error("Failed to force refresh monetization config:", error);
      return this.mode;
    }
  }

  // Fetch configuration from server
  async loadServerConfig() {
    try {
      // Get API URL from environment variable or use default for development
      const apiUrl =
        import.meta.env.VITE_API_URL || "http://localhost:5000/api";

      // Add timeout to prevent hanging requests
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      const response = await fetch(`${apiUrl}/config/monetization`, {
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      const data = await response.json();

      if (data.success) {
        // Check if server has newer config (server restarted) or mode changed
        const shouldUpdate =
          !this.serverTimestamp ||
          data.serverTimestamp > this.serverTimestamp ||
          this.mode !== data.monetization;

        if (shouldUpdate) {
          const oldMode = this.mode;
          this.mode = data.monetization;
          this.serverTimestamp = data.serverTimestamp;
          this.isLoading = false;

          // Save to cache
          this.saveToCache(this.mode, this.serverTimestamp);

          // Trigger re-render for any listening components only if mode changed
          if (typeof window !== "undefined" && oldMode !== this.mode) {
            window.dispatchEvent(
              new CustomEvent("monetizationConfigChanged", {
                detail: { mode: this.mode },
              })
            );
          }
        } else {
          this.isLoading = false;
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

  // Check if config has been loaded at least once
  isLoaded() {
    return this.serverTimestamp !== null;
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
