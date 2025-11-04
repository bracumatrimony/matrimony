


const config = {
  
  isMonetizationEnabled: () => {
    return process.env.MONETIZATION === "on";
  },

  
  getMonetizationStatus: () => {
    return process.env.MONETIZATION || "off";
  },

  
  isCreditSystemEnabled: () => {
    return config.isMonetizationEnabled();
  },

  
  shouldRecordTransactions: () => {
    return config.isMonetizationEnabled();
  },

  
  shouldRequireCreditsForContact: () => {
    return config.isMonetizationEnabled();
  },

  
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
