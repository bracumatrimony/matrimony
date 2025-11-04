


class MonetizationConfig {
  constructor() {
    this.monetization = null; 
  }

  
  async getMonetizationStatus() {
    if (this.monetization !== null) {
      return this.monetization;
    }
    
    try {
      
      if (typeof window !== "undefined" && window.location) {
        
        this.monetization = await this.fetchMonetizationStatus();
        return this.monetization;
      }
      return "off"; 
    } catch (error) {
      console.warn(
        "Could not determine monetization status, defaulting to free access"
      );
      return "off";
    }
  }

  
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
    return "off"; 
  }

  
  async isMonetizationEnabled() {
    const status = await this.getMonetizationStatus();
    return status === "on";
  }

  
  async isCreditSystemEnabled() {
    return await this.isMonetizationEnabled();
  }

  
  async shouldShowMonetizationRoutes() {
    return await this.isMonetizationEnabled();
  }

  
  async shouldShowCreditUI() {
    return await this.isMonetizationEnabled();
  }

  
  async getFreeAccessMessage() {
    return (await this.isMonetizationEnabled())
      ? null
      : "Contact information is free during our launch period!";
  }

  
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

  
  updateMonetizationStatus(status) {
    this.monetization = status;
  }
}


export const monetizationConfig = new MonetizationConfig();


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


export default monetizationConfig;
