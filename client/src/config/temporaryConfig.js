// Monetization Configuration Module
// Controls client-side monetization features based on environment

class MonetizationConfig {
  constructor() {
    this.monetization = null; // Will be fetched lazily
  }

  // Get monetization status from environment or API
  async getMonetizationStatus() {
    if (this.monetization !== null) {
      return this.monetization;
    }
    // Try to get from Vite environment variables
    try {
      // Vite automatically exposes VITE_ prefixed environment variables
      if (typeof window !== "undefined" && window.location) {
        // In browser environment, we'll fetch this from the server API
        this.monetization = await this.fetchMonetizationStatus();
        return this.monetization;
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
  async isMonetizationEnabled() {
    const status = await this.getMonetizationStatus();
    return status === "on";
  }

  // Check if credit system should be shown
  async isCreditSystemEnabled() {
    return await this.isMonetizationEnabled();
  }

  // Check if credits/transactions routes should be available
  async shouldShowMonetizationRoutes() {
    return await this.isMonetizationEnabled();
  }

  // Check if credit-related UI should be displayed
  async shouldShowCreditUI() {
    return await this.isMonetizationEnabled();
  }

  // Get message for free access mode
  async getFreeAccessMessage() {
    return (await this.isMonetizationEnabled())
      ? null
      : "Contact information is free during our launch period!";
  }

  // Get configuration for components
  async getConfig() {
    const monetizationEnabled = await this.isMonetizationEnabled();
    return {
      monetizationEnabled,
      creditSystemEnabled: await this.isCreditSystemEnabled(),
      showCreditUI: await this.shouldShowCreditUI(),
      showMonetizationRoutes: await this.shouldShowMonetizationRoutes(),
      freeAccessMessage: await this.getFreeAccessMessage(),
      mode: await this.getMonetizationStatus(),
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
