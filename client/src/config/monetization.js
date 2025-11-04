


class MonetizationConfig {
  constructor() {
    
    const cachedConfig = this.getCachedConfig();
    this.mode = cachedConfig ? cachedConfig.mode : "off"; 
    this.serverTimestamp = cachedConfig ? cachedConfig.serverTimestamp : null;
    this.isLoading = true; 

    
    this.loadServerConfig(); 
  }

  
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

  
  isCacheExpired() {
    try {
      const cached = localStorage.getItem("monetizationConfig");
      if (cached) {
        const { timestamp } = JSON.parse(cached);
        const fiveMinutes = 5 * 60 * 1000; 
        return Date.now() - timestamp > fiveMinutes;
      }
    } catch (error) {
      return true;
    }
    return true;
  }

  
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

  
  async forceRefresh() {
    try {
      this.isLoading = true;
      
      localStorage.removeItem("monetizationConfig");
      this.serverTimestamp = null;

      await this.loadServerConfig();
      return this.mode;
    } catch (error) {
      console.error("Failed to force refresh monetization config:", error);
      return this.mode;
    }
  }

  
  async loadServerConfig() {
    try {
      
      const apiUrl =
        import.meta.env.VITE_API_URL || "http://localhost:5000/api";

      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); 

      const response = await fetch(`${apiUrl}/config/monetization`, {
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      const data = await response.json();

      if (data.success) {
        
        const shouldUpdate =
          !this.serverTimestamp ||
          data.serverTimestamp > this.serverTimestamp ||
          this.mode !== data.monetization;

        if (shouldUpdate) {
          const oldMode = this.mode;
          this.mode = data.monetization;
          this.serverTimestamp = data.serverTimestamp;
          this.isLoading = false;

          
          this.saveToCache(this.mode, this.serverTimestamp);

          
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

  
  isEnabled() {
    return this.mode === "on";
  }

  
  isCreditSystemEnabled() {
    return this.isEnabled();
  }

  
  isLoaded() {
    return this.serverTimestamp !== null;
  }

  
  shouldShowCreditUI() {
    return this.isEnabled();
  }

  
  getFreeAccessMessage() {
    return this.isEnabled() ? null : "🎉 Launch Period - Everything is FREE!";
  }

  
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


export const monetizationConfig = new MonetizationConfig();


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
