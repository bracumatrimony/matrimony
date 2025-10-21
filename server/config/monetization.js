// Monetization Configuration Module
// Controls whether monetization features (credits, transactions) are enabled

const config = {
  // Check if monetization is enabled via environment variable
  isMonetizationEnabled: () => {
    return process.env.MONETIZATION === "on";
  },

  // Get monetization status
  getMonetizationStatus: () => {
    return process.env.MONETIZATION || "off";
  },

  // Check if credit system should be active
  isCreditSystemEnabled: () => {
    return config.isMonetizationEnabled();
  },

  // Check if transactions should be recorded
  shouldRecordTransactions: () => {
    return config.isMonetizationEnabled();
  },

  // Check if contact unlock should require credits
  shouldRequireCreditsForContact: () => {
    return config.isMonetizationEnabled();
  },

  // Get configuration summary for logging
  getConfigSummary: () => {
    const status = config.getMonetizationStatus();
    return {
      monetization: status,
      creditSystem: status === "on",
      freeAccess: status === "off",
      message:
        status === "on"
          ? "Monetization enabled - Credit system active"
          : "Monetization disabled - Free access mode",
    };
  },
};

module.exports = config;
