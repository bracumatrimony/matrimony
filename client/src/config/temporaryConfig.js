// Monetization Configuration Module
// Controls client-side monetization features based on environment

class MonetizationConfig {
  constructor() {
    // Check if we're in development and can access import.meta.env
    this.monetization = this.getMonetizationStatus();
  }

  // Get monetization status from environment or API
  getMonetizationStatus() {
    // Try to get from Vite environment variables
    try {
      // Vite automatically exposes VITE_ prefixed environment variables
      if (typeof window !== "undefined" && window.location) {
        // In browser environment, we'll fetch this from the server API
        return this.fetchMonetizationStatus();
      }
      return "off"; // Default to free access
    } catch (error) {
      console.warn(
        "Could not determine monetization status, defaulting to free access"
      );
      return "off";
    }
  }

  // Fetch monetization status from server (async)
  async fetchMonetizationStatus() {
    try {
      const response = await fetch("/api/config/monetization");
      if (response.ok) {
        const data = await response.json();
        return data.monetization || "off";
      }
    } catch (error) {
      console.warn("Could not fetch monetization status from server");
    }
    return "off"; // Default to free access
  }

  // Check if monetization is enabled
  isMonetizationEnabled() {
    return this.monetization === "on";
  }

  // Check if credit system should be shown
  isCreditSystemEnabled() {
    return this.isMonetizationEnabled();
  }

  // Check if credits/transactions routes should be available
  shouldShowMonetizationRoutes() {
    return this.isMonetizationEnabled();
  }

  // Check if credit-related UI should be displayed
  shouldShowCreditUI() {
    return this.isMonetizationEnabled();
  }

  // Get message for free access mode
  getFreeAccessMessage() {
    return this.isMonetizationEnabled()
      ? null
      : "Contact information is free during our launch period!";
  }

  // Get configuration for components
  getConfig() {
    return {
      monetizationEnabled: this.isMonetizationEnabled(),
      creditSystemEnabled: this.isCreditSystemEnabled(),
      showCreditUI: this.shouldShowCreditUI(),
      showMonetizationRoutes: this.shouldShowMonetizationRoutes(),
      freeAccessMessage: this.getFreeAccessMessage(),
      mode: this.monetization,
    };
  }

  // Update monetization status (for dynamic changes)
  updateMonetizationStatus(status) {
    this.monetization = status;
  }
}

// Create singleton instance
export const monetizationConfig = new MonetizationConfig();

// Legacy compatibility
export const TEMPORARY_CONFIG = {
  get ENABLE_CREDIT_SYSTEM() {
    return monetizationConfig.isCreditSystemEnabled();
  },
  get LAUNCH_MESSAGE() {
    return monetizationConfig.getFreeAccessMessage() || "";
  },
  get SHOW_LAUNCH_MESSAGE() {
    return !monetizationConfig.isMonetizationEnabled();
  },
};

// Export default configuration object
export default monetizationConfig;
